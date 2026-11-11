"""Fase 7.3: notificaciones push, en la versión compilada (la que tiene service worker).

Las pruebas de siempre no dependen de internet:
1. La tarjeta con el backend real: solo la suscripción del navegador es falsa.
2. El service worker: se le entrega un mensaje push (como los que manda el backend) por el protocolo de
   depuración de Chromium, y se comprueba que muestre la notificación.
3. Con Edge (en Windows) además se prueba TODO el camino con el servicio de push real de Microsoft:
   backend -> pywebpush -> internet -> service worker -> notificación. Si no hay internet, se saltea.
El envío (pywebpush) también está probado en backend/tests/test_push.py."""
import json
import os

import pytest

from conftest import YOLO, api, esperar_texto, sesion

PWA = os.getenv("PWA_URL", "http://localhost:5001")

# Reemplaza la suscripción del navegador por una falsa (".invalid" es un dominio que no existe)
SUSCRIPCION_FALSA = """
(() => {
  const falsa = {
    endpoint: 'https://push.invalid/e2e-maria',
    toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'clave-p256dh-e2e', auth: 'clave-auth-e2e' } } },
    async unsubscribe() { window.__suscripto = false; return true },
  }
  PushManager.prototype.subscribe = async function () { window.__suscripto = true; return falsa }
  PushManager.prototype.getSubscription = async function () { return window.__suscripto ? falsa : null }
})()
"""


@pytest.fixture
def encargada(navegador, base_limpia):
    """Panel con la sesión de María y el permiso de notificaciones ya dado, con el service worker listo."""
    ctx = navegador.new_context(locale="es-AR", permissions=["notifications"])
    ctx.add_init_script(f"localStorage.setItem('user', {json.dumps(json.dumps(sesion('maria')))});")
    ctx.add_init_script(SUSCRIPCION_FALSA)
    pag = ctx.new_page()
    pag.goto(PWA + "/app/panel")
    pag.evaluate("navigator.serviceWorker.ready.then(() => true)")
    yield pag
    ctx.close()


def notificaciones(pag):
    """Notificaciones que el service worker mostró en el sistema: [{titulo, texto}]."""
    return pag.evaluate("""navigator.serviceWorker.ready.then((r) => r.getNotifications())
                           .then((lista) => lista.map((n) => ({ titulo: n.title, texto: n.body })))""")


def test_activar_probar_y_desactivar_desde_la_tarjeta(encargada):
    pag = encargada
    tarjeta = pag.get_by_role("region", name="Notificaciones")
    assert esperar_texto(pag, "Apagadas", 5), tarjeta.inner_text()

    tarjeta.get_by_role("button", name="Activar notificaciones").click()
    assert esperar_texto(pag, "Activadas", 8), tarjeta.inner_text()
    tarjeta.get_by_role("button", name="Enviar una de prueba").click()     # el backend la encontró guardada
    assert esperar_texto(pag, "Notificación de prueba enviada", 8)

    tarjeta.get_by_role("button", name="Desactivar").click()
    assert esperar_texto(pag, "Apagadas", 8)
    pag.reload()
    assert esperar_texto(pag, "Apagadas", 8)


def test_el_service_worker_muestra_la_notificacion(encargada):
    pag = encargada
    cdp = pag.context.new_cdp_session(pag)
    registros = []
    cdp.on("ServiceWorker.workerRegistrationUpdated", lambda evento: registros.extend(evento["registrations"]))
    cdp.send("ServiceWorker.enable")
    for _ in range(20):
        if registros:
            break
        pag.wait_for_timeout(250)
    registro = next(r["registrationId"] for r in registros if r["scopeURL"].startswith(PWA))

    mensaje = {"titulo": "Nueva alerta: sin casco", "texto": "Zona C · Pedro Sosa · máquina detenida",
               "url": "/app/incidencias", "etiqueta": "alerta-99"}
    cdp.send("ServiceWorker.deliverPushMessage", {"origin": PWA, "registrationId": registro, "data": json.dumps(mensaje)})
    for _ in range(20):
        if notificaciones(pag):
            break
        pag.wait_for_timeout(250)
    assert notificaciones(pag) == [{"titulo": "Nueva alerta: sin casco", "texto": "Zona C · Pedro Sosa · máquina detenida"}], \
        f"permiso de notificaciones: {pag.evaluate('Notification.permission')}"


@pytest.mark.skipif(os.getenv("NAVEGADOR", "chromium") != "msedge", reason="el servicio de push real se prueba con Edge")
def test_push_real_con_el_servicio_de_edge(navegador, base_limpia, tmp_path):
    # Perfil "normal" (no de incógnito, como los demás contextos de prueba): en incógnito no hay push
    ctx = navegador.browser_type.launch_persistent_context(str(tmp_path / "perfil"), channel="msedge", headless=True, locale="es-AR")
    try:
        ctx.grant_permissions(["notifications"], origin=PWA)
        ctx.add_init_script(f"localStorage.setItem('user', {json.dumps(json.dumps(sesion('maria')))});")
        pag = ctx.new_page()
        pag.goto(PWA + "/app/panel")
        pag.evaluate("navigator.serviceWorker.ready.then(() => true)")
        tarjeta = pag.get_by_role("region", name="Notificaciones")
        tarjeta.get_by_role("button", name="Activar notificaciones").click()
        for _ in range(40):
            if tarjeta.get_by_text("Activadas").is_visible() or "no pudo conectarse" in tarjeta.inner_text():
                break
            pag.wait_for_timeout(500)
        if not tarjeta.get_by_text("Activadas").is_visible():
            pytest.skip("Sin conexión con el servicio de push de Edge (¿hay internet?). La tarjeta dice: " + " ".join(tarjeta.inner_text().split()))

        api("/incidents", cabeceras=YOLO, datos={"tipo": "sin_chaleco", "zona_id": 4, "empleado_id": 7, "confianza": 0.93})
        esperada = {"titulo": "Nueva alerta: sin chaleco", "texto": "Zona D · Sofía Romero · máquina detenida"}
        for _ in range(60):                                  # pasa por los servidores de Microsoft: puede tardar
            if esperada in notificaciones(pag):
                break
            pag.wait_for_timeout(500)
        assert esperada in notificaciones(pag)

        tarjeta.get_by_role("button", name="Desactivar").click()
        assert esperar_texto(pag, "Apagadas", 10)
    finally:
        ctx.close()
