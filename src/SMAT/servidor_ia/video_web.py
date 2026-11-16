"""Reenvía a la web el video de la IA (con los recuadros de detección dibujados).

¿Por qué hace falta? La cámara del robot (ESP32-CAM) solo puede mandarle video a UNA
persona a la vez. Si la IA la está mirando, la web no puede verla. Entonces la IA,
que ya tiene cada foto, la vuelve a publicar en:

    http://<IP-de-esta-PC>:8080/video

Esa es la dirección que se pone en la web: Robot → Dirección del video (ver docs/API.md).
El puerto se puede cambiar con PUERTO_VIDEO en servidor_ia/.env.

Solo usa librerías que vienen con Python (no hay que instalar nada).
"""
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from config import dato

PUERTO_VIDEO = int(dato("PUERTO_VIDEO", "8080"))

_ultima_foto = None            # la última foto en JPEG (bytes)
_candado = threading.Lock()    # para que la IA y el servidor no la toquen a la vez


def publicar_foto(frame):
    """La llama la IA en cada vuelta: guarda la foto para mandarla a la web."""
    global _ultima_foto
    import cv2   # acá adentro, igual que en conexion_droid.py
    ok, jpg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    if ok:
        with _candado:
            _ultima_foto = jpg.tobytes()


class _PedidoVideo(BaseHTTPRequestHandler):
    """Atiende a cada navegador que abre /video: le manda fotos una atrás de la otra."""

    def do_GET(self):
        if self.path.split("?")[0] != "/video":
            self.send_error(404, "El video está en /video")
            return
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=cuadro")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")   # la web está en otra dirección
        self.end_headers()
        enviada = None
        try:
            while True:
                with _candado:
                    foto = _ultima_foto
                if foto is not None and foto is not enviada:   # solo si hay una foto nueva
                    self.wfile.write(b"--cuadro\r\nContent-Type: image/jpeg\r\n")
                    self.wfile.write(f"Content-Length: {len(foto)}\r\n\r\n".encode())
                    self.wfile.write(foto + b"\r\n")
                    enviada = foto
                time.sleep(0.05)
        except (ConnectionError, OSError):
            pass   # cerraron la página: dejamos de mandar

    def log_message(self, *args):
        pass   # no llena la consola con un renglón por cada pedido


def iniciar_servidor_video():
    """Arranca el servidor de video en segundo plano (no frena a la IA)."""
    try:
        servidor = ThreadingHTTPServer(("0.0.0.0", PUERTO_VIDEO), _PedidoVideo)
    except OSError as e:
        print(f"[AVISO VIDEO] No pude usar el puerto {PUERTO_VIDEO} ({e}). La web no va a ver el video.")
        return
    servidor.daemon_threads = True
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    print(f"[VIDEO] La web puede ver el video en http://<IP-de-esta-PC>:{PUERTO_VIDEO}/video")
