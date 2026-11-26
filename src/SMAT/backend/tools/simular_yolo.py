"""Simula el servidor de IA (YOLO) para probar la web sin cámara ni modelo.

Hace lo mismo que el servidor real, usando la API de docs/API.md:
  - lee las zonas y su EPP obligatorio        (GET /zones)
  - lee qué empleados puede reconocer           (GET /rostros: los que tienen fotos con consentimiento)
  - cada tanto "detecta" a alguien sin un EPP  (POST /incidents con una foto de evidencia)

La foto la dibuja el propio script (una persona con un recuadro rojo), o podés pasar una tuya con --imagen.
Ojo: cada alerta queda guardada en la base del backend, como una real.

Uso (con el backend andando):
    cd backend
    python tools/simular_yolo.py                        # una alerta cada 20 s; lee YOLO_API_KEY del .env
    python tools/simular_yolo.py --cada 5 --cantidad 3  # 3 alertas, una cada 5 s
    python tools/simular_yolo.py --zona 2 --empleado 4  # siempre en la Zona B y como Carlos
    python tools/simular_yolo.py --imagen foto.jpg      # con una foto propia (JPG o PNG)
Para cortarlo: Ctrl+C.
"""
import argparse
import json
import os
import random
import struct
import sys
import time
import urllib.error
import urllib.request
import uuid
import zlib
from datetime import datetime

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


def avisar(texto):
    print(f"[{datetime.now():%H:%M:%S}] {texto}", flush=True)


class Api:
    """Llamadas al backend con la clave de la IA en el header X-API-KEY."""

    def __init__(self, url, clave):
        self.url, self.clave = url.rstrip("/"), clave

    def leer(self, ruta):
        pedido = urllib.request.Request(self.url + ruta, headers={"X-API-KEY": self.clave})
        with urllib.request.urlopen(pedido, timeout=5) as respuesta:
            return json.loads(respuesta.read())

    def enviar_alerta(self, campos, foto, nombre_foto):
        """POST /incidents como multipart/form-data (campos de texto + la foto en "imagen")."""
        limite = uuid.uuid4().hex
        partes = []
        for nombre, valor in campos.items():
            partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="{nombre}"\r\n\r\n{valor}\r\n'.encode())
        tipo = "image/png" if nombre_foto.endswith(".png") else "image/jpeg"
        partes.append(f'--{limite}\r\nContent-Disposition: form-data; name="imagen"; filename="{nombre_foto}"\r\n'
                      f"Content-Type: {tipo}\r\n\r\n".encode() + foto + b"\r\n")
        partes.append(f"--{limite}--\r\n".encode())
        pedido = urllib.request.Request(
            self.url + "/incidents", method="POST", data=b"".join(partes),
            headers={"X-API-KEY": self.clave, "Content-Type": f"multipart/form-data; boundary={limite}"})
        with urllib.request.urlopen(pedido, timeout=10) as respuesta:
            return json.loads(respuesta.read())


# ---------- Foto de evidencia dibujada a mano (PNG sin librerías) ----------

def png(ancho, alto, pixel):
    """Arma un PNG a partir de una función pixel(x, y) -> (r, g, b)."""
    filas = b"".join(b"\x00" + bytes(c for x in range(ancho) for c in pixel(x, y)) for y in range(alto))

    def bloque(tipo, datos):
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos))
    return (b"\x89PNG\r\n\x1a\n" + bloque(b"IHDR", struct.pack(">IIBBBBB", ancho, alto, 8, 2, 0, 0, 0))
            + bloque(b"IDAT", zlib.compress(filas, 9)) + bloque(b"IEND", b""))


# Dónde va el recuadro rojo según el EPP que falta (x1, y1, x2, y2 en una imagen de 320x240)
RECUADROS = {"sin_casco": (130, 20, 190, 80), "sin_lentes": (138, 42, 182, 66), "sin_chaleco": (115, 85, 205, 175)}


def foto_de_evidencia(tipo):
    caja = RECUADROS[tipo]

    def pixel(x, y):
        x1, y1, x2, y2 = caja
        if (x1 <= x <= x2 and y in (y1, y1 + 1, y2 - 1, y2)) or (y1 <= y <= y2 and x in (x1, x1 + 1, x2 - 1, x2)):
            return (220, 38, 38)                                   # recuadro de la detección
        if (x - 160) ** 2 + (y - 50) ** 2 <= 26 ** 2:
            return (214, 170, 140)                                 # cabeza
        if 120 <= x <= 200 and 80 <= y <= 200:
            return (60, 90, 140)                                   # cuerpo
        if (100 <= x <= 120 or 200 <= x <= 220) and 85 <= y <= 180:
            return (60, 90, 140)                                   # brazos
        if y > 200:
            return (90, 90, 95)                                    # piso
        return (34, 40, 52) if (x // 40 + y // 40) % 2 else (40, 47, 60)   # pared de la fábrica
    return png(320, 240, pixel)


# ---------- Simulación ----------

def elegir_deteccion(zonas, rostros, args):
    """Arma una detección al azar respetando el EPP que pide cada zona."""
    candidatas = [z for z in zonas if z["epp_requerido"] and (not args.zona or z["id"] == args.zona)]
    if not candidatas:
        raise RuntimeError("No hay zonas con EPP obligatorio (o la zona pedida no existe)")
    zona = random.choice(candidatas)
    tipo = "sin_" + random.choice(zona["epp_requerido"])
    if args.empleado is not None:
        empleado_id = args.empleado or ""                           # --empleado 0 = no reconocido
    else:
        empleado_id = random.choice(rostros)["empleado_id"] if rostros and random.random() < 0.8 else ""
    return zona, tipo, empleado_id


def main():
    ap = argparse.ArgumentParser(description="Simula el servidor de IA (YOLO) que detecta faltas de EPP")
    ap.add_argument("--url", default=os.getenv("DROID_URL", "http://127.0.0.1:5000/api"), help="dirección del backend")
    ap.add_argument("--key", default=os.getenv("YOLO_API_KEY", ""), help="YOLO_API_KEY (por defecto, la del .env)")
    ap.add_argument("--cada", type=float, default=20, help="segundos entre una alerta y la siguiente")
    ap.add_argument("--cantidad", type=int, default=0, help="cuántas alertas mandar (0 = hasta Ctrl+C)")
    ap.add_argument("--zona", type=int, help="id de zona fija (si no, una al azar)")
    ap.add_argument("--empleado", type=int, help="id de empleado fijo; 0 = no reconocido (si no, uno de /rostros al azar)")
    ap.add_argument("--imagen", help="foto JPG o PNG propia para usar como evidencia")
    args = ap.parse_args()

    if not args.key:
        sys.exit("Falta la clave: poné YOLO_API_KEY en backend/.env o usá --key")
    api = Api(args.url, args.key)
    foto_propia = open(args.imagen, "rb").read() if args.imagen else None

    try:
        zonas = api.leer("/zones")["zonas"]
        rostros = api.leer("/rostros")["rostros"]
    except urllib.error.HTTPError as e:
        sys.exit(f"El backend respondió {e.code}: {e.read().decode(errors='replace')}")
    except urllib.error.URLError:
        sys.exit(f"No se pudo conectar con {args.url}: ¿está andando el backend?")
    avisar(f"IA simulada lista: {len(zonas)} zonas, {len(rostros)} empleados con fotos de rostro")

    enviadas = 0
    try:
        while not args.cantidad or enviadas < args.cantidad:
            zona, tipo, empleado_id = elegir_deteccion(zonas, rostros, args)
            foto = foto_propia or foto_de_evidencia(tipo)
            nombre = os.path.basename(args.imagen) if args.imagen else "deteccion.png"
            campos = {"tipo": tipo, "zona_id": zona["id"], "empleado_id": empleado_id,
                      "confianza": round(random.uniform(0.62, 0.97), 2)}
            try:
                inc = api.enviar_alerta(campos, foto, nombre)
                avisar(f"ALERTA #{inc['id']}: {tipo} en {inc['zona']} ({inc['empleado_nombre']}, {inc['confianza']:.0%})")
            except urllib.error.HTTPError as e:
                avisar(f"El backend rechazó la alerta ({e.code}): {e.read().decode(errors='replace')}")
            except urllib.error.URLError:
                avisar("Sin conexión con el backend; se reintenta en la próxima")
            enviadas += 1
            if not args.cantidad or enviadas < args.cantidad:
                time.sleep(args.cada)
    except KeyboardInterrupt:
        pass
    avisar(f"Fin: {enviadas} alerta(s) enviadas")


if __name__ == "__main__":
    main()
