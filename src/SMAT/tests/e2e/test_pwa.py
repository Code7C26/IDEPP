"""Fase 7.2: la web se puede instalar como app (PWA) y abre aunque se corte la conexión.
Usa la versión compilada que sirve el backend de prueba (como en PythonAnywhere): el service worker solo existe ahí."""
import json
import os
import urllib.request

import pytest

PWA = os.getenv("PWA_URL", "http://localhost:5001")


@pytest.fixture
def contexto(navegador):
    ctx = navegador.new_context(locale="es-AR")
    yield ctx
    ctx.close()


def test_el_manifest_permite_instalar_la_app():
    manifest = json.loads(urllib.request.urlopen(f"{PWA}/manifest.webmanifest").read())
    assert manifest["name"] == "DROID-E3D by IDEPP"
    assert manifest["display"] == "standalone"
    assert manifest["start_url"] == "/app"
    assert {"192x192", "512x512"} <= {i["sizes"] for i in manifest["icons"]}
    assert any(i.get("purpose") == "maskable" for i in manifest["icons"])
    for icono in manifest["icons"]:                       # los íconos existen de verdad
        assert urllib.request.urlopen(PWA + icono["src"]).status == 200


def test_la_app_abre_sin_conexion(contexto):
    pag = contexto.new_page()
    pag.goto(PWA + "/")
    assert pag.locator('link[rel="manifest"]').count() == 1
    pag.evaluate("navigator.serviceWorker.ready.then(() => true)")   # quedó instalado y con la app guardada
    pag.reload()
    assert pag.evaluate("!!navigator.serviceWorker.controller")       # ahora la página pasa por el service worker

    contexto.set_offline(True)
    pag.goto(PWA + "/login")
    assert pag.get_by_role("button", name="Ingresar").is_visible()
    pag.goto(PWA + "/como-funciona")
    assert pag.locator("h1").first.is_visible()


def test_los_renders_no_se_descargan_al_instalar_la_app():
    """Pesan mucho: solo los baja quien los abre, no todos los que instalan la PWA."""
    service_worker = urllib.request.urlopen(f"{PWA}/sw.js").read().decode()
    assert "assets/index-" in service_worker
    assert "robot3d/" not in service_worker.split("NavigationRoute")[0]


def test_el_service_worker_no_reemplaza_los_renders_por_la_app(contexto):
    """Son páginas propias: si el service worker abriera la app en su lugar, el iframe mostraría la web adentro."""
    pag = contexto.new_page()
    pag.goto(PWA + "/")
    pag.evaluate("navigator.serviceWorker.ready.then(() => true)")
    pag.reload()
    assert pag.evaluate("!!navigator.serviceWorker.controller")
    pag.goto(PWA + "/robot3d/fabrica.html")
    assert pag.title() == "DROID-E3D en la fábrica"
