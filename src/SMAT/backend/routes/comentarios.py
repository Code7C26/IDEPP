"""Comentarios en las alertas: el encargado y el empleado detectado pueden escribirse sobre una alerta
(por ejemplo: "Estaba cambiando el casco roto, ya me dieron uno nuevo")."""
from flask import Blueprint, request

from models import db, Comentario, Incidencia, Usuario
from utils.auditoria import registrar
from utils.decoradores import token_required
from utils.push import notificar_comentario
from utils.validacion import leer_json, texto

comentarios_bp = Blueprint("comentarios", __name__)

MAX_CARACTERES = 500


def incidencia_permitida(inc_id):
    """La alerta, si el usuario la puede ver: el encargado ve todas; el empleado, solo las suyas.
    Devuelve (incidencia, None) o (None, respuesta de error)."""
    inc = db.get_or_404(Incidencia, inc_id)
    if request.user_rol != "encargado" and inc.empleado_id != request.user_id:
        return None, ({"error": "No tenés permiso para ver esta alerta"}, 403)
    return inc, None


@comentarios_bp.route("/incidents/<int:inc_id>/comentarios", methods=["GET"])
@token_required
def listar_comentarios(inc_id):
    inc, error = incidencia_permitida(inc_id)
    if error:
        return error
    return {"comentarios": [c.to_dict() for c in inc.comentarios]}


@comentarios_bp.route("/incidents/<int:inc_id>/comentarios", methods=["POST"])
@token_required
def comentar(inc_id):
    """Body: {"texto": "..."} (1 a 500 caracteres). Avisa con una notificación push a la otra parte."""
    inc, error = incidencia_permitida(inc_id)
    if error:
        return error
    contenido, error = texto(leer_json(), "texto", "El comentario", MAX_CARACTERES, obligatorio=True)
    if error:
        return {"error": error}, 400
    comentario = Comentario(incidencia_id=inc.id, usuario_id=request.user_id, texto=contenido)
    comentario.usuario = db.session.get(Usuario, request.user_id)
    db.session.add(comentario)
    registrar("comentar_incidencia", f"Incidencia #{inc.id}: {contenido[:120]}")
    db.session.commit()
    notificar_comentario(inc, comentario)
    return comentario.to_dict(), 201
