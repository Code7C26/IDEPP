"""Conexión del servidor de IA con el backend de DROID-E3D (la web).

El motor (motor_ia_robot.py) sigue funcionando igual que antes: detecta, reconoce la cara,
guarda en su base y le avisa al robot. Además, con este archivo cada alerta llega a la web
con la FOTO del momento, el nombre del trabajador y la confianza. Contrato: src/SMAT/docs/API.md

Configuración (en servidor_ia/.env o como variables de entorno; la clave nunca va en el código):
    DROID_URL       ej. http://192.168.0.10:5000/api   (por defecto http://127.0.0.1:5000/api)
    YOLO_API_KEY    la misma que está en src/SMAT/backend/.env
    DROID_ZONA_ID   opcional: zona fija. Si no se pone, la web usa la zona donde está el robot.
Si la IA corre en la misma PC que el backend, no hace falta configurar nada: lee ../backend/.env.
"""
import os
import threading

import requests

from config import dato, leer_env

CARPETA = os.path.dirname(os.path.abspath(__file__))

# Lo que dice el motor -> el tipo de falta que entiende la web
TIPOS = {"Falta de Casco": "sin_casco", "Falta de Guantes": "sin_guantes",
         "Falta de Lentes": "sin_lentes", "Falta de Chaleco": "sin_chaleco"}


def _leer_env_del_backend():
    """Toma las claves de ../backend/.env si no están en el entorno (misma PC que el backend)."""
    return leer_env(os.path.join(CARPETA, "..", "backend", ".env"))


_ENV = _leer_env_del_backend()
# dato(): primero las variables de entorno y después servidor_ia/.env (ver config.py)
URL = dato("DROID_URL", "http://127.0.0.1:5000/api").rstrip("/")
CLAVE = dato("YOLO_API_KEY") or _ENV.get("YOLO_API_KEY", "")
ZONA_ID = dato("DROID_ZONA_ID")


def _enviar(infraccion, trabajador, confianza, foto_jpg):
    datos = {"tipo": TIPOS.get(infraccion, "sin_casco"),
             "empleado": "" if trabajador == "Desconocido" else trabajador,
             "confianza": round(min(max(confianza / 100, 0), 1), 2)}   # el motor usa 0-100; la web 0-1
    if ZONA_ID:
        datos["zona_id"] = ZONA_ID
    try:
        if foto_jpg:   # con foto: multipart (campos como texto + la imagen)
            r = requests.post(f"{URL}/incidents", headers={"X-API-KEY": CLAVE}, data=datos, timeout=10,
                              files={"imagen": ("deteccion.jpg", foto_jpg, "image/jpeg")})
        else:          # sin foto: JSON
            r = requests.post(f"{URL}/incidents", headers={"X-API-KEY": CLAVE}, json=datos, timeout=10)
        if r.status_code == 201:
            inc = r.json()
            aviso = " | máquina DETENIDA" if inc.get("maquina_detenida") else ""
            print(f"[WEB] Alerta #{inc['id']} en {inc['zona']} ({inc['empleado_nombre']}){aviso}")
        else:
            print(f"[ERROR WEB] La web rechazó la alerta ({r.status_code}): {r.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR WEB] No hay conexión con la web: {e}")


def reportar_a_la_web(infraccion, trabajador, confianza, frame=None):
    """Manda la alerta a la web sin frenar el video (se envía en segundo plano).
    infraccion: "Falta de Casco"... · trabajador: nombre de la carpeta o "Desconocido"
    confianza: 0 a 100 (como la usa el motor) · frame: imagen de OpenCV con los recuadros dibujados"""
    if not CLAVE:
        print("[AVISO WEB] Falta YOLO_API_KEY: la alerta no se manda a la web.")
        return
    foto = None
    if frame is not None:
        import cv2   # acá adentro: así el envío se puede probar sin tener OpenCV instalado
        ok, jpg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        foto = jpg.tobytes() if ok else None
    threading.Thread(target=_enviar, args=(infraccion, trabajador, confianza, foto), daemon=True).start()
