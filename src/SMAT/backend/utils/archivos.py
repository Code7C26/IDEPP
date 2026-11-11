"""Guardado y borrado de fotos (evidencias de las alertas y rostros de los empleados).

Las fotos se guardan en backend/uploads/<carpeta>/ con un nombre inventado por el servidor
(nunca el nombre que manda el usuario) y en la base se anota la ruta pública, por ejemplo
"/uploads/evidencias/12_a1b2c3d4.jpg". La web la pide a /api + esa ruta.

En internet (Render) el disco se borra cada vez que el servidor se reinicia, así que ahí las fotos
van a Supabase Storage (un "bucket" privado). Se usa solo si están SUPABASE_URL y SUPABASE_SECRET_KEY;
la ruta pública y todo lo demás es igual en los dos casos.
"""
import os
import re
import uuid

import requests

from config import Config

CARPETAS = ("evidencias", "rostros")

# Los primeros bytes de cada formato: así se reconoce la imagen aunque le cambien la extensión
FIRMAS = {b"\xff\xd8\xff": "jpg", b"\x89PNG\r\n\x1a\n": "png"}
TIPOS_MIME = {"jpg": "image/jpeg", "png": "image/png"}

# Los nombres los inventa el servidor: "12_a1b2c3d4.jpg". Cualquier otra cosa se rechaza.
NOMBRE_VALIDO = re.compile(r"^\d+_[0-9a-f]{8}\.(jpg|png)$")


class ImagenInvalida(ValueError):
    """La foto no es JPG/PNG o es demasiado grande. El mensaje se muestra tal cual al usuario."""


class AlmacenNoDisponible(RuntimeError):
    """No se pudo guardar la foto en Supabase Storage (sin conexión o mal configurado)."""


def tipo_de_imagen(contenido):
    for firma, extension in FIRMAS.items():
        if contenido.startswith(firma):
            return extension
    return None


def guardar_imagen(archivo, carpeta, prefijo):
    """Valida y guarda un archivo subido (request.files[...]). Devuelve la ruta pública.
    prefijo: algo que identifique a quién pertenece (id de la incidencia o del empleado)."""
    if carpeta not in CARPETAS:
        raise ValueError(f"Carpeta desconocida: {carpeta}")
    contenido = archivo.read()
    if not contenido:
        raise ImagenInvalida("La imagen está vacía")
    if len(contenido) > Config.MAX_IMAGEN_MB * 1024 * 1024:
        raise ImagenInvalida(f"La imagen supera los {Config.MAX_IMAGEN_MB} MB")
    extension = tipo_de_imagen(contenido)
    if not extension:
        raise ImagenInvalida("La imagen debe ser JPG o PNG")

    nombre = f"{prefijo}_{uuid.uuid4().hex[:8]}.{extension}"
    if usa_supabase():
        _subir_a_supabase(carpeta, nombre, contenido, TIPOS_MIME[extension])
    else:
        destino = os.path.join(Config.UPLOAD_DIR, carpeta)
        os.makedirs(destino, exist_ok=True)
        with open(os.path.join(destino, nombre), "wb") as f:
            f.write(contenido)
    return f"/uploads/{carpeta}/{nombre}"


def ruta_en_disco(ruta_publica):
    """Convierte "/uploads/rostros/x.jpg" en la ruta del archivo en la PC."""
    _, _, carpeta, nombre = ruta_publica.split("/", 3)
    return os.path.join(Config.UPLOAD_DIR, carpeta, nombre)


def borrar_imagen(ruta_publica):
    """Borra el archivo si existe (si ya no estaba, no pasa nada)."""
    if usa_supabase():
        try:
            requests.delete(_url_storage(ruta_publica.split("/", 2)[2]), headers=_cabeceras(), timeout=10)
        except requests.RequestException:
            pass   # si falla, queda una foto huérfana en el bucket: no rompe nada
        return
    try:
        os.remove(ruta_en_disco(ruta_publica))
    except (FileNotFoundError, ValueError):
        pass


# ---------- Supabase Storage (solo en internet) ----------

def usa_supabase():
    return bool(Config.SUPABASE_URL and Config.SUPABASE_SECRET_KEY)


def _cabeceras():
    clave = Config.SUPABASE_SECRET_KEY
    cabeceras = {"apikey": clave}
    if clave.startswith("eyJ"):   # clave vieja de Supabase (service_role, formato JWT): va también acá
        cabeceras["Authorization"] = f"Bearer {clave}"
    return cabeceras


def _url_storage(ruta_en_bucket):
    return f"{Config.SUPABASE_URL}/storage/v1/object/{Config.SUPABASE_BUCKET}/{ruta_en_bucket}"


def _subir_a_supabase(carpeta, nombre, contenido, tipo_mime):
    try:
        r = requests.post(_url_storage(f"{carpeta}/{nombre}"), data=contenido, timeout=20,
                          headers={**_cabeceras(), "Content-Type": tipo_mime})
    except requests.RequestException as e:
        raise AlmacenNoDisponible(f"No hay conexión con Supabase Storage: {e}") from e
    if r.status_code >= 300:
        raise AlmacenNoDisponible(f"Supabase Storage no guardó la foto ({r.status_code}): {r.text[:200]}")


def leer_de_supabase(carpeta, nombre):
    """Devuelve (bytes, tipo MIME) de una foto del bucket, o None si no existe."""
    try:
        r = requests.get(_url_storage(f"{carpeta}/{nombre}"), headers=_cabeceras(), timeout=20)
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    return r.content, TIPOS_MIME[nombre.rsplit(".", 1)[1]]


def crear_bucket():
    """Crea el bucket privado de las fotos si no existe. Se llama al arrancar la app (wsgi.py)."""
    r = requests.post(f"{Config.SUPABASE_URL}/storage/v1/bucket", headers=_cabeceras(), timeout=20,
                      json={"id": Config.SUPABASE_BUCKET, "name": Config.SUPABASE_BUCKET, "public": False})
    if r.status_code < 300 or "already exists" in r.text or "Duplicate" in r.text:
        return True
    print(f"[AVISO] No se pudo crear el bucket de fotos en Supabase ({r.status_code}): {r.text[:200]}")
    return False
