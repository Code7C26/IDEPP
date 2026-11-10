"""Configuración del servidor de IA que cambia según la red (IPs de la cámara y del robot).

Los datos se leen de servidor_ia/.env, que NO se sube a GitHub: cada uno tiene el suyo.
Para crearlo, copiá .env.example como .env y poné tus IPs.
También se pueden pasar como variables de entorno (tienen prioridad sobre el .env).
"""
import os

CARPETA = os.path.dirname(os.path.abspath(__file__))


def leer_env(ruta):
    """Lee un archivo .env (líneas CLAVE=valor) y devuelve un diccionario. Si no existe, {}."""
    if not os.path.exists(ruta):
        return {}
    valores = {}
    for linea in open(ruta, encoding="utf-8"):
        if "=" in linea and not linea.lstrip().startswith("#"):
            clave, valor = linea.split("=", 1)
            valores[clave.strip()] = valor.strip().strip('"').strip("'")
    return valores


_ENV = leer_env(os.path.join(CARPETA, ".env"))
if not _ENV:
    print("[AVISO] No hay servidor_ia/.env: copiá .env.example como .env y poné tus IPs.")


def dato(nombre, por_defecto=""):
    """Busca un dato primero en las variables de entorno y después en servidor_ia/.env.
    Si en el .env quedó vacío (ej. "DROID_URL="), usa el valor por defecto."""
    return os.getenv(nombre) or _ENV.get(nombre) or por_defecto


# Cámara del robot (ESP32-CAM): la IP que muestra en el Monitor Serie, con /video al final.
# URL_CAMARA_CELULAR es el nombre viejo (cuando la cámara era el celular): se sigue aceptando.
URL_CAMARA = dato("URL_CAMARA") or dato("URL_CAMARA_CELULAR", "http://192.168.0.100/video")
# IP que muestra la pantalla del robot (con /alerta_seguridad al final)
URL_ESP32_ALERTA = dato("URL_ESP32_ALERTA", "http://192.168.0.101/alerta_seguridad")
