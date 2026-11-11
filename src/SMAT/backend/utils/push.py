"""Notificaciones push (Web Push): avisan una alerta al celular o la PC aunque la web esté cerrada.

Cómo funciona:
1. El navegador del usuario se suscribe (routes/push.py guarda su "dirección" en suscripciones_push).
2. Cuando la IA reporta una alerta, notificar_alerta() arma el mensaje para los encargados y para el
   empleado detectado, y se lo manda al servicio de push de cada navegador (Google, Mozilla, Apple).
3. El service worker de la web (frontend/public/sw-push.js) recibe el mensaje y muestra la notificación.
"""
import json
import threading

from flask import current_app

from config import Config
from models import db, SuscripcionPush, Usuario

try:
    from pywebpush import WebPushException, webpush
except ImportError:   # sin la librería la web sigue andando, solo que sin notificaciones
    webpush = None

NOMBRES_TIPO = {"sin_casco": "Sin casco", "sin_guantes": "Sin guantes", "sin_lentes": "Sin lentes", "sin_chaleco": "Sin chaleco"}


def push_configurado():
    """True si el servidor tiene las claves VAPID y la librería para mandar notificaciones."""
    return bool(webpush and Config.VAPID_PUBLIC_KEY and Config.VAPID_PRIVATE_KEY)


def enviar_a_usuarios(usuario_ids, mensaje):
    """Manda el mensaje ({titulo, texto, url, etiqueta}) a todos los dispositivos de esos usuarios.
    Devuelve a cuántos dispositivos se le mandó. El envío va en otro hilo para que quien reportó
    la alerta (la IA) no espere a los servicios de push; en las pruebas automáticas va en el mismo."""
    if not push_configurado() or not usuario_ids:
        return 0
    suscripciones = SuscripcionPush.query.filter(SuscripcionPush.usuario_id.in_(usuario_ids)).all()
    destinos = [(s.id, s.endpoint, s.p256dh, s.auth) for s in suscripciones]
    if not destinos:
        return 0
    app = current_app._get_current_object()
    datos = json.dumps(mensaje, ensure_ascii=False)
    if app.config.get("TESTING"):
        _enviar(app, destinos, datos)
    else:
        threading.Thread(target=_enviar, args=(app, destinos, datos), daemon=True).start()
    return len(destinos)


def _enviar(app, destinos, datos):
    vencidas = []
    for id_suscripcion, endpoint, p256dh, auth in destinos:
        try:
            webpush(subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
                    data=datos, vapid_private_key=Config.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": Config.VAPID_CONTACTO}, ttl=3600, timeout=10)
        except WebPushException as e:
            # 404 o 410: ese navegador ya no existe o quitó el permiso -> se borra la suscripción
            if e.response is not None and e.response.status_code in (404, 410):
                vencidas.append(id_suscripcion)
            else:
                app.logger.warning("No se pudo mandar la notificación push: %s", e)
        except Exception as e:   # sin internet, servicio caído...: la alerta igual queda en la web
            app.logger.warning("No se pudo mandar la notificación push: %s", e)
    if vencidas:
        with app.app_context():
            SuscripcionPush.query.filter(SuscripcionPush.id.in_(vencidas)).delete(synchronize_session=False)
            db.session.commit()


def notificar_alerta(inc, maquina_detenida=False):
    """Avisa una alerta nueva: a los encargados (con el nombre del empleado) y al empleado detectado."""
    tipo = NOMBRES_TIPO.get(inc.tipo, inc.tipo)
    zona = inc.zona.nombre if inc.zona else "zona desconocida"
    encargados = [u.id for u in Usuario.query.filter_by(rol="encargado", activo=True).all()]
    quien = inc.empleado.nombre if inc.empleado else "Persona no identificada"
    enviar_a_usuarios(encargados, {
        "titulo": f"Nueva alerta: {tipo.lower()}",
        "texto": f"{zona} · {quien}" + (" · máquina detenida" if maquina_detenida else ""),
        "url": "/app/incidencias",
        "etiqueta": f"alerta-{inc.id}",
    })
    if inc.empleado and inc.empleado.activo:
        equipo = inc.tipo.removeprefix("sin_")
        enviar_a_usuarios([inc.empleado.id], {
            "titulo": f"Recordá usar {'el' if equipo in ('casco', 'chaleco') else 'los'} {equipo}",
            "texto": f"El sistema te detectó {tipo.lower()} en {zona}. Cuidate.",
            "url": "/app/mis-alertas",
            "etiqueta": f"alerta-{inc.id}",
        })


def notificar_comentario(inc, comentario):
    """Avisa un comentario nuevo a la otra parte: si comenta el encargado, al empleado de la alerta;
    si comenta el empleado, a los encargados."""
    autor = comentario.usuario
    texto = comentario.texto if len(comentario.texto) <= 120 else comentario.texto[:117] + "..."
    mensaje = {"titulo": f"{autor.nombre} comentó una alerta", "texto": texto, "etiqueta": f"comentario-{inc.id}"}
    if autor.rol == "encargado":
        if inc.empleado and inc.empleado.activo:
            enviar_a_usuarios([inc.empleado.id], {**mensaje, "url": "/app/mis-alertas"})
    else:
        encargados = [u.id for u in Usuario.query.filter_by(rol="encargado", activo=True).all()]
        enviar_a_usuarios(encargados, {**mensaje, "url": "/app/incidencias"})
