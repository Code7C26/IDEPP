"""Arma droid-e3d.tgz para subir a PythonAnywhere (ver docs/DESPLIEGUE.md).

El repo es privado, así que en vez de hacer "git clone" en el servidor se sube un solo archivo con:
  - backend/        solo los archivos que están en git (nada de venv, .env, uploads ni fotos)
  - frontend/dist/  la web compilada (antes: npm run build en frontend)

Uso, desde src/SMAT (en la PC):
    python backend/tools/armar_paquete.py
"""
import os
import subprocess
import sys
import tarfile

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # src/SMAT
DIST = os.path.join(APP, "frontend", "dist")
SALIDA = os.path.join(APP, "droid-e3d.tgz")


def main():
    if not os.path.isfile(os.path.join(DIST, "index.html")):
        sys.exit("Falta la web compilada: en la carpeta frontend corré  npm run build")

    # Solo lo que está en git: así nunca se cuela un .env, una clave o una foto
    archivos = subprocess.run(["git", "ls-files", "backend"], cwd=APP, capture_output=True, text=True,
                              check=True).stdout.splitlines()

    with tarfile.open(SALIDA, "w:gz") as paquete:
        for ruta in archivos:
            paquete.add(os.path.join(APP, ruta), arcname=f"droid-e3d/{ruta}")
        paquete.add(DIST, arcname="droid-e3d/frontend/dist")

    print(f"Listo: {SALIDA} ({os.path.getsize(SALIDA) // 1024} KB, {len(archivos)} archivos del backend + la web)")


if __name__ == "__main__":
    main()
