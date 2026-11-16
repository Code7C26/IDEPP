"""Copia los renders y el juego de DROID-E3D (los HTML descargados de Claude) a la web: frontend/public/robot3d.

Se copian tal cual, salvo dos cosas:
  - los enlaces a internet (Three.js y las tipografías) pasan a ser archivos locales, para que anden sin
    conexión el día de la demo, y se suma embebido.js, que solo actúa cuando el archivo está dentro de la web;
  - si todavía dicen SMAT (el nombre viejo de la empresa), el logo del chasis pasa a decir IDEPP y los títulos
    DROID-E3D, como quedó en el PR #104.

Si cambiás un render o el juego en Claude, descargalo de nuevo y corré esto:
    cd backend
    python tools/copiar_renders.py                     # los busca en la carpeta Descargas
    python tools/copiar_renders.py --carpeta C:\\otra   # o en otra carpeta
Después: npm run build en frontend.
"""
import argparse
import os
import re
import sys

DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend", "public", "robot3d")

# Nombre en la web -> nombres posibles del archivo descargado (primero el nuevo)
ARCHIVOS = {
    "robot.html": ["Robot DROID-E3D 3D.html", "Robot SMAT 3D.html"],
    "fabrica.html": ["DROID-E3D en la fábrica.html", "SMAT en la fábrica.html"],
    "patrulla.html": ["Patrulla DROID-E3D.html", "Patrulla SMAT.html"],
}

# Qué se reemplaza en cada archivo: si alguno falta, el archivo cambió y hay que revisarlo a mano
CAMBIOS = [
    ('<link rel="preconnect" href="https://fonts.googleapis.com">\n', ""),
    ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap">',
     '<link rel="stylesheet" href="/robot3d/fuentes.css">'),
    ('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>',
     '<script src="/robot3d/embebido.js"></script>\n<script src="/robot3d/three.min.js"></script>'),
    ('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>',
     '<script src="/robot3d/OrbitControls.js"></script>'),
]


def main():
    ap = argparse.ArgumentParser(description="Copia los renders y el juego a frontend/public/robot3d")
    ap.add_argument("--carpeta", default=os.path.join(os.path.expanduser("~"), "Downloads"), help="dónde están los HTML descargados")
    args = ap.parse_args()

    for nombre, posibles in ARCHIVOS.items():
        origen = next((p for p in posibles if os.path.isfile(os.path.join(args.carpeta, p))), None)
        if not origen:
            sys.exit(f"No encontré «{posibles[0]}» en {args.carpeta}")
        # newline="": no cambia los saltos de línea del archivo
        texto = open(os.path.join(args.carpeta, origen), encoding="utf-8", newline="").read().replace("\r\n", "\n")
        for viejo, nuevo in CAMBIOS:
            if viejo not in texto:
                sys.exit(f"«{origen}» cambió y no encontré esto para reemplazar: {viejo[:70]}")
            texto = texto.replace(viejo, nuevo)
        # El nombre viejo: el logo del chasis dice IDEPP (la empresa) y el resto, DROID-E3D (el producto)
        texto = texto.replace("ctx.fillText('SMAT',", "ctx.fillText('IDEPP',")
        texto = re.sub(r"\bSMAT\b", "DROID-E3D", texto)
        if "https://" in texto.replace("http://www.w3.org", ""):
            print(f"Ojo: «{origen}» todavía tiene algún enlace a internet. Revisalo: no andaría sin conexión.")
        with open(os.path.join(DESTINO, nombre), "w", encoding="utf-8", newline="") as salida:
            salida.write(texto)
        print(f"{origen} -> public/robot3d/{nombre}")


if __name__ == "__main__":
    main()
