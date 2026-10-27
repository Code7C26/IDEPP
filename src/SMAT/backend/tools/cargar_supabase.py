"""Carga las tablas y los datos de ejemplo en Supabase (Postgres). Ver docs/DESPLIEGUE.md.

Se corre UNA vez, en la PC, con MySQL (XAMPP) andando: los datos de ejemplo salen de database/schema.sql,
se arman en una base MySQL temporal y se copian a Supabase (tests/base_datos.copiar_a_postgres).
Uso, desde src/SMAT/backend con el venv activado:
    python tools/cargar_supabase.py

Pide:
  - la dirección de Supabase: botón "Connect" → "Session pooler" (con tu contraseña de la base adentro).
  - una contraseña nueva para los usuarios de ejemplo: la de siempre, "pass123", está en el README.
También se pueden pasar como variables de entorno: DATABASE_URL y CLAVE_EJEMPLO.
"""
import getpass
import os
import sys

CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, CARPETA)
os.chdir(CARPETA)

from sqlalchemy import create_engine, inspect, text  # noqa: E402
from werkzeug.security import generate_password_hash  # noqa: E402

from config import url_postgres  # noqa: E402
from models import db  # noqa: E402
from tests.base_datos import borrar_base, copiar_a_postgres, recrear_base  # noqa: E402

BASE_TEMPORAL = "robot_db_supabase_test"   # en el MySQL de la PC; se borra al terminar


def pedir_direccion():
    url = os.getenv("DATABASE_URL") or getpass.getpass("Dirección de Supabase (Connect → Session pooler): ").strip()
    if not url.startswith(("postgresql://", "postgres://")):
        sys.exit("Esa no es una dirección de Postgres: tiene que empezar con postgresql://")
    if "[YOUR-PASSWORD]" in url:
        sys.exit("Falta poner tu contraseña de la base en lugar de [YOUR-PASSWORD].")
    if ":6543/" in url:
        print("[AVISO] Esa es la del Transaction pooler (6543). Conviene la del Session pooler (5432).")
    return url


def pedir_clave():
    clave = os.getenv("CLAVE_EJEMPLO") or getpass.getpass("Contraseña nueva para los usuarios de ejemplo (mínimo 8): ")
    if len(clave) < 8 or (not os.getenv("CLAVE_EJEMPLO") and clave != getpass.getpass("Repetila: ")):
        sys.exit("La contraseña es muy corta o no coincide. No se cargó nada.")
    return clave


def main():
    url = pedir_direccion()
    destino = create_engine(url_postgres(url))
    with destino.connect() as conexion:
        if inspect(conexion).has_table("usuarios") and conexion.execute(text("SELECT COUNT(*) FROM usuarios")).scalar():
            sys.exit("Supabase ya tiene usuarios: no se carga nada (para no pisar datos de verdad).")
    clave = pedir_clave()

    print("1/3 Armando los datos de ejemplo en el MySQL de la PC…")
    recrear_base(BASE_TEMPORAL)
    try:
        print("2/3 Copiando las tablas a Supabase…")
        # vaciar=True: si la web ya arrancó una vez, creó tablas vacías y la fila del robot
        copiar_a_postgres(BASE_TEMPORAL, url, vaciar=True)
    finally:
        borrar_base(BASE_TEMPORAL)

    print("3/3 Contraseña nueva y seguridad de Supabase…")
    with destino.begin() as conexion:
        conexion.execute(text("UPDATE usuarios SET contrasena = :c"), {"c": generate_password_hash(clave)})
        for tabla in db.metadata.sorted_tables:   # lo mismo que hace la app al arrancar (app.py)
            conexion.execute(text(f'ALTER TABLE "{tabla.name}" ENABLE ROW LEVEL SECURITY'))
        usuarios = conexion.execute(text("SELECT usuario, rol FROM usuarios ORDER BY id")).all()
        alertas = conexion.execute(text("SELECT COUNT(*) FROM incidencias")).scalar()
    destino.dispose()

    print(f"\nListo: {len(usuarios)} usuarios y {alertas} alertas de ejemplo en Supabase.")
    print("Usuarios (todos con la contraseña que elegiste):", ", ".join(f"{u} ({r})" for u, r in usuarios))


if __name__ == "__main__":
    main()
