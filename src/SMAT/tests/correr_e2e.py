"""Corre las pruebas de punta a punta (navegador real) de DROID-E3D.

Levanta su PROPIO backend (puerto 5001) y su PROPIA web (puerto 5174) con una base de prueba
(robot_db_e2e), corre las pruebas de tests/e2e y apaga todo al terminar. No toca tus datos
ni los servidores que estés usando para desarrollar.
Además compila la web (carpeta frontend/dist-e2e) y la sirve el mismo backend, como en el servidor
de verdad (docs/DESPLIEGUE.md): así se prueban la PWA y las notificaciones, que solo existen compiladas.

Uso, desde src/SMAT (con el venv del backend activado y MySQL andando):
    python tests/correr_e2e.py                      # en Windows usa Edge
    python tests/correr_e2e.py --navegador chromium # el que usa GitHub Actions
    python tests/correr_e2e.py -k robot             # se le pueden pasar opciones de pytest
"""
import argparse
import importlib.util
import os
import signal
import subprocess
import sys
import tempfile
import time
import urllib.request

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND, FRONTEND = os.path.join(APP, "backend"), os.path.join(APP, "frontend")
LOGS = os.path.join(APP, "tests", "e2e", "logs")


def _cargar_base_datos():
    """Carga backend/tests/base_datos.py por su ruta (hay dos carpetas 'tests' y no deben confundirse)."""
    ruta = os.path.join(APP, "backend", "tests", "base_datos.py")
    spec = importlib.util.spec_from_file_location("base_datos_prueba", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo.recrear_base


recrear_base = _cargar_base_datos()


def _claves_push_nuevas():
    """Claves VAPID creadas en el momento (nunca se guardan): así se prueban las notificaciones push."""
    ruta = os.path.join(BACKEND, "tools", "generar_claves_push.py")
    spec = importlib.util.spec_from_file_location("generar_claves_push", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo.generar_claves()


VAPID_PUBLICA, VAPID_PRIVADA = _claves_push_nuevas()

PUERTO_API, PUERTO_WEB = 5001, 5174
CONFIG = {
    "DB_NAME": "robot_db_e2e", "FLASK_PORT": str(PUERTO_API), "FLASK_DEBUG": "0",
    "YOLO_API_KEY": "clave-yolo-e2e", "ROBOT_API_KEY": "clave-robot-e2e", "JWT_SECRET": "secreto-e2e",
    "API_URL": f"http://127.0.0.1:{PUERTO_API}/api", "WEB_URL": f"http://localhost:{PUERTO_WEB}",
    # La web compilada la sirve el backend (como en PythonAnywhere): misma dirección que la API
    "PWA_URL": f"http://localhost:{PUERTO_API}", "WEB_DIST": os.path.join(FRONTEND, "dist-e2e"),
    "VAPID_PUBLIC_KEY": VAPID_PUBLICA, "VAPID_PRIVATE_KEY": VAPID_PRIVADA,
    "VITE_API_URL": f"http://127.0.0.1:{PUERTO_API}/api",
    "UPLOAD_DIR": tempfile.mkdtemp(prefix="droid-e2e-uploads-"),
    # Contacto de la página pública: datos de mentira, solo para probar que el mensaje se arma bien
    "VITE_CONTACTO_EMAIL": "demo@ejemplo.com", "VITE_CONTACTO_WHATSAPP": "5491100000000",   # las fotos de prueba no ensucian backend/uploads
}


def arrancar(comando, carpeta, entorno, archivo_log):
    """Inicia un proceso en segundo plano, guardando lo que imprime en un archivo."""
    log = open(os.path.join(LOGS, archivo_log), "w", encoding="utf-8")
    extra = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" else {"start_new_session": True}
    return subprocess.Popen(comando, cwd=carpeta, env=entorno, stdout=log, stderr=subprocess.STDOUT, **extra)


def detener(proceso):
    """Apaga el proceso y todos sus hijos (npm abre otros procesos)."""
    if proceso.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(proceso.pid)], capture_output=True)
    else:
        os.killpg(proceso.pid, signal.SIGTERM)


def esperar(url, segundos=90):
    fin = time.time() + segundos
    while time.time() < fin:
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except Exception:
            time.sleep(1)
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--navegador", default="msedge" if os.name == "nt" else "chromium", help="msedge o chromium")
    args, opciones_pytest = ap.parse_known_args()

    os.makedirs(LOGS, exist_ok=True)
    entorno = {**os.environ, **CONFIG, "NAVEGADOR": args.navegador, "E2E_DB": CONFIG["DB_NAME"], "PYTHONIOENCODING": "utf-8"}
    print(f"Preparando la base de prueba {CONFIG['DB_NAME']}…", flush=True)
    recrear_base(CONFIG["DB_NAME"])

    npm = "npm.cmd" if os.name == "nt" else "npm"
    backend = arrancar([sys.executable, "app.py"], BACKEND, entorno, "backend.log")
    web = arrancar([npm, "run", "dev", "--", "--port", str(PUERTO_WEB), "--strictPort"], FRONTEND, entorno, "web.log")
    # Versión compilada (con service worker) para las pruebas de la PWA. Usa "/api", igual que la publicada.
    print("Compilando la web para las pruebas de la PWA…", flush=True)
    with open(os.path.join(LOGS, "build.log"), "w", encoding="utf-8") as log:
        compilo = subprocess.call([npm, "run", "build", "--", "--outDir", "dist-e2e"], cwd=FRONTEND,
                                  env={**entorno, "VITE_API_URL": "/api"}, stdout=log, stderr=subprocess.STDOUT) == 0
    try:
        if not compilo or not all(esperar(url) for url in (f"{CONFIG['API_URL']}/health", CONFIG["WEB_URL"], CONFIG["PWA_URL"])):
            print(f"No arrancaron los servidores. Revisá {LOGS}", file=sys.stderr)
            return 1
        print("Servidores listos. Corriendo las pruebas…", flush=True)
        return subprocess.call([sys.executable, "-m", "pytest", os.path.join(APP, "tests", "e2e"), "-q", *opciones_pytest],
                               cwd=APP, env=entorno)
    finally:
        detener(web)
        detener(backend)


if __name__ == "__main__":
    sys.exit(main())
