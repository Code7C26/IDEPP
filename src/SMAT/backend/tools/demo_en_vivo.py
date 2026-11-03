"""Hace andar DROID-E3D sin hardware: lanza juntos el robot simulado y la IA simulada.

Es para ver o mostrar la web funcionando. Usa los simuladores de siempre (simular_esp32.py y simular_yolo.py):
  - el robot recorre las zonas y obedece las órdenes de la web
  - cada tanto entra una alerta con foto, y la máquina de esa zona se detiene

Ojo: agrega alertas ficticias y detiene máquinas en la base que use el backend. No borra nada.
Por eso apunta siempre a esta PC, aunque el .env tenga DROID_URL con la versión online.

Uso (con el backend andando):
    cd backend
    python tools/demo_en_vivo.py             # una alerta cada 30 s
    python tools/demo_en_vivo.py --cada 15   # más seguido
Después entrá a la web como encargado, andá a Robot y tocá Iniciar.
Para cortarlo: Ctrl+C.
"""
import argparse
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

CARPETA = os.path.dirname(os.path.abspath(__file__))
URL_LOCAL = "http://127.0.0.1:5000/api"


def lanzar(script, *opciones):
    """Arranca un simulador. Las claves las lee él mismo del .env. -u: que sus mensajes salgan enseguida."""
    return subprocess.Popen([sys.executable, "-u", os.path.join(CARPETA, script), *opciones])


def main():
    ap = argparse.ArgumentParser(description="Lanza juntos el robot simulado y la IA simulada")
    ap.add_argument("--url", default=URL_LOCAL, help="dirección del backend (por defecto, esta PC)")
    ap.add_argument("--cada", type=float, default=30, help="segundos entre una alerta y la siguiente")
    ap.add_argument("--velocidad", type=float, default=10, help="velocidad del robot: 1 = tiempo real")
    ap.add_argument("--duracion", type=float, default=0, help="corta solo a los N segundos (0 = hasta Ctrl+C)")
    args = ap.parse_args()

    try:
        urllib.request.urlopen(f"{args.url}/health", timeout=5)
    except (urllib.error.URLError, TimeoutError):
        sys.exit(f"No se pudo conectar con {args.url}: primero arrancá el backend (python app.py)")

    simuladores = [
        lanzar("simular_esp32.py", "--url", args.url, "--velocidad", str(args.velocidad), "--maquinas"),
        lanzar("simular_yolo.py", "--url", args.url, "--cada", str(args.cada)),
    ]
    print("\nDemo en vivo andando. En la web: entrá como encargado, andá a Robot y tocá Iniciar. Ctrl+C para cortar.\n", flush=True)

    inicio = time.time()
    try:
        # Si un simulador se corta solo (por ejemplo, porque falta una clave), se corta todo
        while all(s.poll() is None for s in simuladores) and (not args.duracion or time.time() - inicio < args.duracion):
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass                  # el Ctrl+C también les llega a los simuladores, y el robot avisa que se detuvo
    finally:
        for s in simuladores:
            try:
                s.wait(timeout=4 if not args.duracion else 0)
            except subprocess.TimeoutExpired:
                s.terminate()
    print("Demo terminada.")


if __name__ == "__main__":
    main()
