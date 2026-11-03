"""Copia los renders y el juego de SMAT (los HTML descargados de Claude) a la web: frontend/public/robot3d.

Se copian tal cual. Lo único que cambia son los enlaces a internet (Three.js y las tipografías), para que anden
sin conexión el día de la demo, y se suma embebido.js, que solo actúa cuando el archivo está dentro de la web.

Si cambiás un render o el juego en Claude, descargalo de nuevo y corré esto:
    cd backend
    python tools/copiar_renders.py                     # los busca en la carpeta Descargas
    python tools/copiar_renders.py --carpeta C:\\otra   # o en otra carpeta
Después: npm run build en frontend.
"""
import argparse
import os
import sys

DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend", "public", "robot3d")

# Nombre del archivo descargado -> nombre en la web
ARCHIVOS = {
    "Robot SMAT 3D.html": "robot.html",
    "SMAT en la fábrica.html": "fabrica.html",
    "Patrulla SMAT.html": "patrulla.html",
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

    for origen, nombre in ARCHIVOS.items():
        ruta = os.path.join(args.carpeta, origen)
        if not os.path.isfile(ruta):
            sys.exit(f"No encontré «{origen}» en {args.carpeta}")
        # newline="": no cambia los saltos de línea del archivo
        texto = open(ruta, encoding="utf-8", newline="").read().replace("\r\n", "\n")
        for viejo, nuevo in CAMBIOS:
            if viejo not in texto:
                sys.exit(f"«{origen}» cambió y no encontré esto para reemplazar: {viejo[:70]}")
            texto = texto.replace(viejo, nuevo)
        if "https://" in texto.replace("http://www.w3.org", ""):
            print(f"Ojo: «{origen}» todavía tiene algún enlace a internet. Revisalo: no andaría sin conexión.")
        with open(os.path.join(DESTINO, nombre), "w", encoding="utf-8", newline="") as salida:
            salida.write(texto)
        print(f"{origen} -> public/robot3d/{nombre}")


if __name__ == "__main__":
    main()
