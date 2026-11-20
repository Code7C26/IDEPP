"""Saca las capturas de la app para el documento final y el README (docs/SMAT/documentacion-final/capturas).

No es una prueba: con las demás queda salteada, y corre solo a pedido. Usa los datos de ejemplo de la base de
prueba: los empleados son ficticios y no aparecen fotos de personas reales. Desde src/SMAT, en PowerShell:
    $env:CAPTURAS_DOCUMENTO = "1"; python tests/correr_e2e.py -k capturas_del_documento
"""
import os

import pytest

from conftest import APP, centrar_render

pytestmark = pytest.mark.skipif(not os.getenv("CAPTURAS_DOCUMENTO"), reason="saca capturas para el documento: solo a pedido")

DESTINO = os.path.join(APP, "..", "..", "docs", "SMAT", "documentacion-final", "capturas")

# archivo, usuario, ruta, ancho, alto, tema, página entera
CAPTURAS = [
    ("01-pagina-publica.png", None, "/", 1366, 844, "claro", True),
    ("02-panel-encargado.png", "maria", "/app/panel", 1366, 844, "claro", True),
    ("03-incidencias.png", "maria", "/app/incidencias", 1366, 844, "claro", True),
    ("04-control-robot.png", "maria", "/app/robot", 1366, 844, "claro", False),
    ("05-reportes.png", "maria", "/app/reportes", 1366, 844, "claro", True),
    ("06-zonas-modo-oscuro.png", "maria", "/app/zonas", 1366, 844, "oscuro", True),
    ("07-empleado-celular.png", "juan", "/app", 360, 740, "claro", False),
    ("08-mis-alertas-celular-oscuro.png", "juan", "/app/mis-alertas", 360, 740, "oscuro", False),
]


def test_capturas_del_documento(base_limpia, abrir_3d):
    for archivo, usuario, ruta, ancho, alto, tema, entera in CAPTURAS:
        pag = abrir_3d(usuario, ruta, ancho=ancho, alto=alto, tema=tema)
        if entera and pag.locator("iframe").count():
            centrar_render(pag)          # para que el render 3D se cargue y se dibuje
            pag.wait_for_timeout(3000)
            pag.evaluate("window.scrollTo(0, 0)")
        pag.wait_for_timeout(1500)
        pag.screenshot(path=os.path.join(DESTINO, archivo), full_page=entera)
        assert not pag.errores, (archivo, pag.errores)
