"""Robot y máquinas, con el ESP32 simulado (backend/tools/simular_esp32.py) y un video MJPEG de prueba."""
import io
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
from PIL import Image, ImageDraw

from conftest import API, APP, ROBOT, YOLO, api, esperar_texto, recrear_base, sesion

PUERTO_VIDEO = 8766
LOG_SIMULADOR = os.path.join(os.path.dirname(__file__), "logs", "simulador.log")


class VideoDePrueba(BaseHTTPRequestHandler):
    """Hace lo mismo que la PC con la IA: manda imágenes JPEG seguidas (MJPEG).
    En /colgada acepta la conexión y nunca contesta, como una cámara apagada o con otra IP."""
    def do_GET(self):
        if self.path == "/colgada":
            time.sleep(15)
            return
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
        self.end_headers()
        try:
            for n in range(600):
                img = Image.new("RGB", (640, 360), (30, 41, 59))
                ImageDraw.Draw(img).text((240, 170), f"CAMARA DE PRUEBA {n}", fill=(255, 255, 255))
                buf = io.BytesIO(); img.save(buf, "JPEG")
                self.wfile.write(b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.getvalue() + b"\r\n")
                time.sleep(0.15)
        except OSError:
            pass

    def log_message(self, *args):
        pass


@pytest.fixture(scope="module")
def robot_simulado():
    """Base limpia + robot simulado + servidor de video, durante todas las pruebas de este archivo."""
    recrear_base(os.getenv("E2E_DB", "robot_db_e2e"))
    os.makedirs(os.path.dirname(LOG_SIMULADOR), exist_ok=True)
    log = open(LOG_SIMULADOR, "w", encoding="utf-8")
    simulador = subprocess.Popen([sys.executable, "-u", os.path.join(APP, "backend", "tools", "simular_esp32.py"),
                                  "--url", API, "--key", ROBOT["X-API-KEY"], "--velocidad", "20", "--maquinas"],
                                 stdout=log, stderr=subprocess.STDOUT, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    video = ThreadingHTTPServer(("127.0.0.1", PUERTO_VIDEO), VideoDePrueba)
    threading.Thread(target=video.serve_forever, daemon=True).start()
    time.sleep(4)
    yield lambda: open(LOG_SIMULADOR, encoding="utf-8", errors="replace").read()
    simulador.terminate()
    video.shutdown()


def test_ordenes_al_robot_y_parada_de_emergencia(robot_simulado, abrir):
    pag = abrir("maria", "/app/robot")
    assert esperar_texto(pag, "Conectado", 6, exacto=False)
    assert pag.get_by_role("button", name="Pausar", exact=True).is_disabled()

    pag.get_by_role("button", name="Iniciar").click()
    assert esperar_texto(pag, "Recorriendo")                      # lo confirma el robot simulado
    assert "ORDEN «iniciar»" in robot_simulado()
    pag.get_by_role("button", name="Pausar", exact=True).click()
    assert esperar_texto(pag, "Pausado")

    pag.get_by_role("button", name="PARADA DE EMERGENCIA").click()
    assert esperar_texto(pag, "EMERGENCIA", 3)
    assert pag.get_by_role("button", name="Iniciar").is_disabled()
    assert pag.get_by_text("primero tocá").is_visible()
    pag.get_by_role("button", name="Detener", exact=True).click()
    assert esperar_texto(pag, "Detenido")
    assert pag.get_by_role("button", name="Iniciar").is_enabled()
    assert not pag.errores


def test_la_vista_3d_sigue_al_robot_simulado(robot_simulado, abrir):
    pag = abrir("maria", "/app/robot")
    assert esperar_texto(pag, "Conectado", 6, exacto=False)
    pag.get_by_role("button", name="Iniciar").click()
    linea = pag.locator("figure [role=status]")
    # El robot simulado cambia de zona cada 1,5 s: el texto tiene que pasar por más de una
    vistas = set()
    for _ in range(40):
        vistas.add(linea.text_content())
        if len({t for t in vistas if t.startswith("En Zona")}) >= 2:
            break
        pag.wait_for_timeout(500)
    assert len({t for t in vistas if t.startswith("En Zona")}) >= 2, vistas
    pag.get_by_role("button", name="Detener", exact=True).click()
    assert esperar_texto(pag, "Detenido")
    assert not pag.errores


def test_editar_la_ruta(robot_simulado, abrir):
    pag = abrir("maria", "/app/robot")
    pag.get_by_role("button", name="Quitar Zona D").click()
    pag.get_by_label("Segundos de espera en Zona A").fill("45")
    pag.get_by_role("button", name="Bajar").first.click()
    pag.get_by_role("button", name="Guardar ruta").click()
    pag.wait_for_timeout(1000)
    assert pag.get_by_text("Ruta guardada").is_visible()
    ruta = api("/robot/ruta", token=sesion("maria")["token"])["ruta"]
    assert [p["zona_id"] for p in ruta] == [2, 1, 3] and ruta[1]["tiempo_espera_seg"] == 45
    pag.get_by_label("Segundos de espera en Zona A").fill("2")
    assert pag.get_by_role("button", name="Guardar ruta").is_disabled()


def test_video_en_vivo(robot_simulado, abrir):
    pag = abrir("maria", "/app/robot")
    assert pag.get_by_text("Sin video configurado").is_visible()
    pag.get_by_label("Dirección del video").fill(f"http://127.0.0.1:{PUERTO_VIDEO}/video")
    pag.get_by_role("button", name="Guardar", exact=True).click()
    pag.wait_for_timeout(2500)
    assert pag.evaluate("document.querySelector('img[alt^=\"Video en vivo\"]')?.naturalWidth") == 640
    assert pag.get_by_text("EN VIVO", exact=True).is_visible()
    pag.get_by_label("Dirección del video").fill("http://127.0.0.1:9/video")
    pag.get_by_role("button", name="Guardar", exact=True).click()
    assert esperar_texto(pag, "Sin señal de video", 6)
    # Cámara que no contesta: primero "Conectando…" (no "EN VIVO") y a los 10 s "Sin señal"
    pag.get_by_label("Dirección del video").fill(f"http://127.0.0.1:{PUERTO_VIDEO}/colgada")
    pag.get_by_role("button", name="Guardar", exact=True).click()
    assert esperar_texto(pag, "Conectando con la cámara…", 3)
    assert not pag.get_by_text("EN VIVO", exact=True).is_visible()
    assert esperar_texto(pag, "Sin señal de video", 13)
    assert esperar_texto(pag, "la dirección termina en /video", 1, exacto=False)


def test_la_falta_detiene_la_maquina_y_el_encargado_la_reactiva(robot_simulado, abrir):
    r = api("/incidents", cabeceras=YOLO, datos={"tipo": "sin_guantes", "zona_id": 3, "empleado_id": 6, "confianza": 0.91})
    assert r["maquina_detenida"] is True
    pag = abrir("maria", "/app/zonas")
    zona_c = pag.locator("article", has_text="Zona C")
    assert zona_c.get_by_text("Máquina detenida").first.is_visible()
    time.sleep(3)
    assert "relé ABIERTO" in robot_simulado()                       # el ESP32 de la máquina cortó

    zona_c.get_by_role("button", name="Reactivar máquina").click()
    pag.wait_for_timeout(800)
    assert pag.get_by_text("sin resolver en esta zona").is_visible()
    pag.get_by_role("button", name="Sí, reactivar").click()
    pag.wait_for_timeout(1200)
    assert api("/zones/3", token=sesion("maria")["token"])["maquina_activa"] is True
    time.sleep(3)
    assert "relé CERRADO" in robot_simulado()
