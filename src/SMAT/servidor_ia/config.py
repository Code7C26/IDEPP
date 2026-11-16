"""Configuración del servidor de IA que cambia según la red (IPs de la cámara y del robot).

Los datos se leen de servidor_ia/.env, que NO se sube a GitHub: cada uno tiene el suyo.
Para crearlo, copiá .env.example como .env y poné tus IPs.
También se pueden pasar como variables de entorno (tienen prioridad sobre el .env).
"""
import os
import socket
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit, urlunsplit

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


def buscar_en_la_red(nombre):
    """Le pregunta «¿quién sos?» (/quien-sos) a cada dirección de la red de esta PC, todas a la vez,
    y devuelve la IP del equipo que contesta con ese nombre (o None). Tarda unos segundos.
    Es el plan B cuando la PC no encuentra el nombre .local (la ESP32-CAM no siempre lo contesta)."""
    try:
        prueba = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        prueba.connect(("10.255.255.255", 1))   # no manda nada: solo sirve para saber la IP de esta PC
        mi_ip = prueba.getsockname()[0]
        prueba.close()
    except OSError:
        return None
    base = mi_ip.rsplit(".", 1)[0]

    def preguntar(ip):
        try:
            with urllib.request.urlopen(f"http://{ip}/quien-sos", timeout=3) as r:
                return ip if r.read(64).decode(errors="ignore").strip() == nombre else None
        except Exception:
            return None

    print(f"[INFO] Buscando {nombre} en la red {base}.x ...")
    with ThreadPoolExecutor(max_workers=128) as grupo:
        for ip in grupo.map(preguntar, [f"{base}.{n}" for n in range(1, 255)]):
            if ip:
                return ip
    return None


def resolver_nombre(url):
    """Si la dirección usa un nombre .local (ej. droid-robot.local), lo cambia por su IP una sola vez.

    Windows tarda ≈ 1 segundo cada vez que busca un nombre .local; con la IP, cada pedido tarda
    menos de 0,1 s (importa para que la alerta llegue a tiempo al robot). Si no lo encuentra,
    deja la dirección como estaba."""
    partes = urlsplit(url)
    if not (partes.hostname or "").endswith(".local"):
        return url
    try:
        ip = socket.getaddrinfo(partes.hostname, None, socket.AF_INET)[0][4][0]
    except OSError:
        ip = buscar_en_la_red(partes.hostname.removesuffix(".local"))
        if ip is None:
            print(f"[AVISO] No encuentro {partes.hostname}: ¿está prendido y en el mismo WiFi?")
            return url
    lugar = ip + (f":{partes.port}" if partes.port else "")
    print(f"[INFO] {partes.hostname} = {ip}")
    return urlunsplit((partes.scheme, lugar, partes.path, partes.query, partes.fragment))


# Cámara del robot (ESP32-CAM). Por defecto se busca por su nombre fijo, en cualquier WiFi.
# URL_CAMARA_CELULAR es el nombre viejo (cuando la cámara era el celular): se sigue aceptando.
URL_CAMARA = resolver_nombre(dato("URL_CAMARA") or dato("URL_CAMARA_CELULAR", "http://droid-camara.local/video"))
# El robot, también por su nombre fijo (con /alerta_seguridad al final)
URL_ESP32_ALERTA = resolver_nombre(dato("URL_ESP32_ALERTA", "http://droid-robot.local/alerta_seguridad"))
