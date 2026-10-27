"""Fotos de rostro de los empleados, para que el servidor de IA los reconozca.

Son datos personales sensibles (Ley 25.326): solo se guardan si se marca el consentimiento,
el empleado puede ver y borrar las suyas, y al darlo de baja se borran.
"""
from datetime import datetime

from flask import Blueprint, request

from models import db, FotoRostro, Usuario
from utils.archivos import AlmacenNoDisponible, ImagenInvalida, borrar_imagen, guardar_imagen
from utils.auditoria import registrar
from utils.decoradores import api_key_requerida, token_required

rostros_bp = Blueprint("rostros", __name__)

MAX_FOTOS = 5   # por empleado: con 3 a 5 fotos de distintos ángulos alcanza


def usuario_permitido(user_id):
    """Las fotos de alguien las maneja el encargado o la misma persona. Devuelve el usuario o un error."""
    if request.user_rol != "encargado" and request.user_id != user_id:
        return None, ({"error": "No tenés permiso para ver estas fotos"}, 403)
    return db.get_or_404(Usuario, user_id), None


@rostros_bp.route("/rostros", methods=["GET"])
@api_key_requerida("YOLO_API_KEY")
def listar_rostros():
    """Para el servidor de IA: empleados activos que tienen fotos (y por lo tanto dieron su consentimiento).
    Las fotos se descargan de /api + cada url, con el mismo header X-API-KEY."""
    usuarios = (Usuario.query.filter_by(activo=True).join(FotoRostro, FotoRostro.usuario_id == Usuario.id)
                .distinct().order_by(Usuario.id).all())
    return {"rostros": [
        {"empleado_id": u.id, "nombre": u.nombre, "fotos": [f.ruta_archivo for f in u.fotos_rostro]}
        for u in usuarios
    ]}


@rostros_bp.route("/users/<int:user_id>/rostros", methods=["GET"])
@token_required
def ver_fotos(user_id):
    user, error = usuario_permitido(user_id)
    if error:
        return error
    return {"fotos": [f.to_dict() for f in user.fotos_rostro], "maximo": MAX_FOTOS}


@rostros_bp.route("/users/<int:user_id>/rostros", methods=["POST"])
@token_required
def subir_foto(user_id):
    """multipart/form-data con "imagen" (JPG/PNG) y "consentimiento" = "true" (obligatorio)."""
    user, error = usuario_permitido(user_id)
    if error:
        return error
    if not user.activo:
        return {"error": "El usuario está dado de baja"}, 400
    if request.form.get("consentimiento") != "true":
        return {"error": "Falta el consentimiento del empleado para guardar su foto"}, 400
    if "imagen" not in request.files:
        return {"error": "Falta la imagen"}, 400
    if len(user.fotos_rostro) >= MAX_FOTOS:
        return {"error": f"Ya tiene {MAX_FOTOS} fotos: borrá una para subir otra"}, 400

    try:
        ruta = guardar_imagen(request.files["imagen"], "rostros", user.id)
    except ImagenInvalida as e:
        return {"error": str(e)}, 400
    except AlmacenNoDisponible:
        return {"error": "No se pudo guardar la foto. Probá de nuevo en un rato."}, 503
    foto = FotoRostro(usuario_id=user.id, ruta_archivo=ruta, consentimiento_at=datetime.now(), cargada_por=request.user_id)
    db.session.add(foto)
    registrar("subir_rostro", f"Foto de rostro de '{user.usuario}' (con consentimiento)")
    db.session.commit()
    return foto.to_dict(), 201


@rostros_bp.route("/users/<int:user_id>/rostros/<int:foto_id>", methods=["DELETE"])
@token_required
def borrar_foto(user_id, foto_id):
    user, error = usuario_permitido(user_id)
    if error:
        return error
    foto = FotoRostro.query.filter_by(id=foto_id, usuario_id=user.id).first_or_404()
    borrar_imagen(foto.ruta_archivo)
    db.session.delete(foto)
    registrar("borrar_rostro", f"Foto de rostro de '{user.usuario}'")
    db.session.commit()
    return {"mensaje": "Foto borrada"}


def borrar_fotos_de(user):
    """Al dar de baja a alguien ya no hace falta reconocerlo: se borran sus fotos (no hace commit)."""
    for foto in list(user.fotos_rostro):
        borrar_imagen(foto.ruta_archivo)
        db.session.delete(foto)
