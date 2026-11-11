"""Notificaciones push: cada usuario activa (o desactiva) las notificaciones en su celular o PC.
El envío está en utils/push.py."""
from flask import Blueprint, request

from config import Config
from models import db, SuscripcionPush
from utils.decoradores import token_required
from utils.push import enviar_a_usuarios, push_configurado
from utils.validacion import leer_json, texto

push_bp = Blueprint("push", __name__)

NO_CONFIGURADO = {"error": "Las notificaciones no están configuradas en el servidor (faltan las claves VAPID)"}, 503


@push_bp.route("/push/clave", methods=["GET"])
@token_required
def clave_publica():
    """Clave pública VAPID: el navegador la necesita para suscribirse."""
    if not push_configurado():
        return NO_CONFIGURADO
    return {"clave_publica": Config.VAPID_PUBLIC_KEY}


@push_bp.route("/push/suscribir", methods=["POST"])
@token_required
def suscribir():
    """Guarda la suscripción que da el navegador: {endpoint, keys: {p256dh, auth}}.
    Si ese navegador ya estaba suscripto (por ejemplo, con otro usuario), pasa a ser del usuario actual."""
    if not push_configurado():
        return NO_CONFIGURADO
    datos = leer_json()
    claves = datos.get("keys") if isinstance(datos.get("keys"), dict) else {}
    endpoint, error = texto(datos, "endpoint", "endpoint", 500, obligatorio=True)
    p256dh, error_p = texto(claves, "p256dh", "keys.p256dh", 255, obligatorio=True)
    auth, error_a = texto(claves, "auth", "keys.auth", 255, obligatorio=True)
    if error or error_p or error_a:
        return {"error": error or error_p or error_a}, 400
    if not endpoint.startswith("https://"):
        return {"error": "endpoint debe ser una dirección https"}, 400

    suscripcion = SuscripcionPush.query.filter_by(endpoint=endpoint).first() or SuscripcionPush(endpoint=endpoint)
    suscripcion.usuario_id = request.user_id
    suscripcion.p256dh, suscripcion.auth = p256dh, auth
    db.session.add(suscripcion)
    db.session.commit()
    return {"mensaje": "Notificaciones activadas en este dispositivo"}, 201


@push_bp.route("/push/desuscribir", methods=["POST"])
@token_required
def desuscribir():
    """Borra la suscripción de este navegador (solo si es del usuario actual). Body: {endpoint}."""
    endpoint, error = texto(leer_json(), "endpoint", "endpoint", 500, obligatorio=True)
    if error:
        return {"error": error}, 400
    SuscripcionPush.query.filter_by(endpoint=endpoint, usuario_id=request.user_id).delete()
    db.session.commit()
    return {"mensaje": "Notificaciones desactivadas en este dispositivo"}


@push_bp.route("/push/probar", methods=["POST"])
@token_required
def probar():
    """Manda una notificación de prueba a todos los dispositivos del usuario actual."""
    if not push_configurado():
        return NO_CONFIGURADO
    enviadas = enviar_a_usuarios([request.user_id], {
        "titulo": "DROID-E3D: notificación de prueba",
        "texto": "Las notificaciones funcionan. Así te vamos a avisar cada alerta.",
        "url": "/app",
        "etiqueta": "prueba",
    })
    if not enviadas:
        return {"error": "No tenés notificaciones activadas en ningún dispositivo"}, 404
    return {"enviadas": enviadas}
