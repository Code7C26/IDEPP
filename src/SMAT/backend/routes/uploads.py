"""Entrega las fotos guardadas (evidencias y rostros), pero solo a quien puede verlas.

No son archivos públicos: muestran caras de personas. Por eso la web las pide con su token
y el servidor de IA con su X-API-KEY.
  - evidencias: el encargado, o el empleado que aparece en esa alerta
  - rostros:    el encargado, o el dueño de la foto
"""
import os

from flask import Blueprint, Response, abort, request, send_from_directory

from config import Config
from models import FotoRostro, Incidencia
from utils.archivos import CARPETAS, NOMBRE_VALIDO, leer_de_supabase, usa_supabase
from utils.decoradores import sesion_o_api_key

uploads_bp = Blueprint("uploads", __name__)


def puede_ver(carpeta, ruta):
    usuario_id = getattr(request, "user_id", None)
    if usuario_id is None:          # entró con la clave del servidor de IA
        return True
    if request.user_rol == "encargado":
        return True
    if carpeta == "evidencias":
        inc = Incidencia.query.filter_by(imagen_url=ruta).first()
        return bool(inc and inc.empleado_id == usuario_id)
    foto = FotoRostro.query.filter_by(ruta_archivo=ruta).first()
    return bool(foto and foto.usuario_id == usuario_id)


@uploads_bp.route("/uploads/<carpeta>/<nombre>", methods=["GET"])
@sesion_o_api_key("YOLO_API_KEY")
def ver_archivo(carpeta, nombre):
    if carpeta not in CARPETAS:
        abort(404)
    if not puede_ver(carpeta, f"/uploads/{carpeta}/{nombre}"):
        return {"error": "No tenés permiso para ver esta foto"}, 403
    if usa_supabase():
        # En internet la foto está en el bucket privado de Supabase: el servidor la busca y la reenvía
        foto = leer_de_supabase(carpeta, nombre) if NOMBRE_VALIDO.match(nombre) else None
        if foto is None:
            abort(404)
        respuesta = Response(foto[0], mimetype=foto[1])
    else:
        # send_from_directory no deja salir de la carpeta (rechaza nombres como "../config.py")
        respuesta = send_from_directory(os.path.join(Config.UPLOAD_DIR, carpeta), nombre)
    respuesta.headers["Cache-Control"] = "private, max-age=3600"
    return respuesta
