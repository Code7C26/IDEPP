"""Carga las tablas y los datos de ejemplo (database/schema.sql) en la base del .env. Ver docs/DESPLIEGUE.md.

Pensado para el servidor (PythonAnywhere), donde la base ya existe vacía:
    python tools/cargar_datos_ejemplo.py

Los usuarios de ejemplo vienen con la contraseña "pass123", que está publicada en el README. Por eso el
script pide una contraseña nueva para todos ellos: en internet, cualquiera podría entrar como la encargada.
Los datos son ficticios (docs/FABRICA-CLIENTE.md) y no hay fotos de personas reales.
"""
import getpass
import os
import sys

import pymysql
from werkzeug.security import generate_password_hash

CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, CARPETA)
os.chdir(CARPETA)

from config import Config  # noqa: E402
from tests.base_datos import sentencias_del_schema  # noqa: E402


def main():
    conexion = pymysql.connect(host=Config.DB_HOST, user=Config.DB_USER, password=Config.DB_PASS,
                               database=Config.DB_NAME, charset="utf8mb4", autocommit=True)
    with conexion.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'usuarios'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM usuarios")
            if cursor.fetchone()[0]:
                print(f"La base '{Config.DB_NAME}' ya tiene usuarios: no se carga nada (para no duplicar datos).")
                return 1

        clave = getpass.getpass("Contraseña nueva para los usuarios de ejemplo (mínimo 8 caracteres): ")
        if len(clave) < 8 or clave != getpass.getpass("Repetila: "):
            print("La contraseña es muy corta o no coincide. No se cargó nada.")
            return 1

        # Se saltea la creación de la base: en el servidor ya existe y tiene otro nombre (ej. "usuario$droid")
        for sentencia in sentencias_del_schema(Config.DB_NAME):
            if sentencia.upper().startswith(("CREATE DATABASE", "USE ")):
                continue
            # Si la web ya arrancó una vez, ya creó la fila del robot: REPLACE la pisa en vez de duplicarla
            cursor.execute(sentencia.replace("INSERT INTO robot ", "REPLACE INTO robot ", 1))
        cursor.execute("UPDATE usuarios SET contrasena = %s", (generate_password_hash(clave),))
        cursor.execute("SELECT usuario, rol FROM usuarios ORDER BY id")
        usuarios = cursor.fetchall()
    conexion.close()

    print(f"Listo: datos de ejemplo cargados en '{Config.DB_NAME}'.")
    print("Usuarios (todos con la contraseña que elegiste):", ", ".join(f"{u} ({r})" for u, r in usuarios))
    return 0


if __name__ == "__main__":
    sys.exit(main())
