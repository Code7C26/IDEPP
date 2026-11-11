"""Crea una base de datos de PRUEBA a partir de database/schema.sql (con los datos de ejemplo).

La usan las pruebas de la API y las de punta a punta. Nunca toca la base de desarrollo (robot_db):
el nombre de la base de prueba tiene que terminar en "_test" o "_e2e".
"""
import os
import re

import pymysql

SCHEMA = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")


def sentencias_del_schema(nombre_base):
    """Lee schema.sql, le saca los comentarios y lo divide en sentencias, usando la base indicada."""
    lineas = []
    for linea in open(SCHEMA, encoding="utf-8"):
        linea = re.sub(r"\s--.*$", "", linea.rstrip("\n"))   # comentario al final de la línea
        if linea.strip().startswith("--"):
            continue
        lineas.append(linea)
    texto = re.sub(r"\brobot_db\b", nombre_base, "\n".join(lineas))
    return [s.strip() for s in texto.split(";") if s.strip()]


def _conectar(nombre_base, host=None, usuario=None, clave=None):
    if not re.search(r"_(test|e2e)$", nombre_base):
        raise ValueError(f"Por seguridad, la base de prueba debe terminar en _test o _e2e (se pidió '{nombre_base}')")
    return pymysql.connect(host=host or os.getenv("DB_HOST", "127.0.0.1"), user=usuario or os.getenv("DB_USER", "root"),
                           password=clave if clave is not None else os.getenv("DB_PASS", ""), charset="utf8mb4", autocommit=True)


def recrear_base(nombre_base, host=None, usuario=None, clave=None):
    """Borra la base de prueba (si existe) y la vuelve a crear con los datos de ejemplo."""
    conexion = _conectar(nombre_base, host, usuario, clave)
    try:
        with conexion.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{nombre_base}`")
            for sentencia in sentencias_del_schema(nombre_base):
                cursor.execute(sentencia)
    finally:
        conexion.close()


def borrar_base(nombre_base):
    """Borra una base de prueba (por ejemplo, la temporal de tools/cargar_supabase.py)."""
    conexion = _conectar(nombre_base)
    try:
        with conexion.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{nombre_base}`")
    finally:
        conexion.close()


def copiar_a_postgres(nombre_base, url_destino, vaciar=False):
    """Copia todas las tablas de una base MySQL (armada con recrear_base) a Postgres (Supabase).

    La usan las pruebas que corren contra Postgres y tools/cargar_supabase.py. Las tablas se crean
    desde los modelos (models.py), así que valen para los dos motores; los datos pasan fila por fila
    y SQLAlchemy convierte los tipos (por ejemplo, 0/1 de MySQL en false/true de Postgres).
    vaciar=True: borra antes todo lo que haya en Postgres (solo para las pruebas).
    """
    from urllib.parse import quote_plus

    from sqlalchemy import create_engine, select, text

    from config import url_postgres
    from models import db

    clave = quote_plus(os.getenv("DB_PASS", ""))
    origen = create_engine(f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:{clave}@"
                           f"{os.getenv('DB_HOST', '127.0.0.1')}/{nombre_base}?charset=utf8mb4")
    destino = create_engine(url_postgres(url_destino))
    tablas = db.metadata.sorted_tables   # ordenadas: primero las que no dependen de otras
    try:
        db.metadata.create_all(destino)
        with origen.connect() as leer, destino.begin() as escribir:
            if vaciar:
                nombres = ", ".join(f'"{t.name}"' for t in tablas)
                escribir.execute(text(f"TRUNCATE {nombres} RESTART IDENTITY CASCADE"))
            for tabla in tablas:
                filas = [dict(fila) for fila in leer.execute(select(tabla)).mappings()]
                if filas:
                    escribir.execute(tabla.insert(), filas)
                # Los ids se copiaron tal cual: el contador de Postgres tiene que seguir desde el más alto
                escribir.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('\"{tabla.name}\"', 'id'), "
                    f"COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM \"{tabla.name}\""))
    finally:
        origen.dispose()
        destino.dispose()
