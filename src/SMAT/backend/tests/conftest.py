"""Configuración común de las pruebas de la API (pytest).

Usa una base de datos SEPARADA (robot_db_test) que se recrea antes de cada prueba,
así las pruebas no dependen entre sí y nunca tocan los datos de desarrollo.
Correr desde src/SMAT:   python -m pytest backend/tests

Con TEST_POSTGRES_URL (una base Postgres vacía) la app usa Postgres, como en Render + Supabase:
cada prueba arma la base MySQL de siempre y la copia a Postgres (tests/base_datos.copiar_a_postgres).
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

import pytest

# La configuración de prueba tiene que estar ANTES de importar la app (config.py la lee al importarse)
os.environ["DB_NAME"] = os.getenv("TEST_DB_NAME", "robot_db_test")
os.environ["YOLO_API_KEY"] = "clave-yolo-de-prueba"
os.environ["ROBOT_API_KEY"] = "clave-robot-de-prueba"
os.environ["JWT_SECRET"] = "secreto-de-prueba"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="droid-uploads-")   # las fotos de prueba no ensucian backend/uploads
POSTGRES = os.getenv("TEST_POSTGRES_URL", "")
if POSTGRES:
    os.environ["DATABASE_URL"] = POSTGRES
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import jwt  # noqa: E402
from app import app as aplicacion  # noqa: E402
from config import Config  # noqa: E402
from models import db  # noqa: E402
from tests.base_datos import copiar_a_postgres, recrear_base  # noqa: E402

YOLO = {"X-API-KEY": "clave-yolo-de-prueba"}
ROBOT = {"X-API-KEY": "clave-robot-de-prueba"}

# Ids de los datos de ejemplo de schema.sql
JUAN, MARIA, CARLOS = 1, 2, 4


def cabecera_de(usuario_id, rol):
    """Header de sesión firmado como lo hace /login (más rápido que loguearse en cada prueba)."""
    token = jwt.encode({"user_id": usuario_id, "rol": rol, "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                       Config.JWT_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cliente():
    """Cliente HTTP de prueba con la base recién creada (40 incidencias, 4 zonas, 7 usuarios)."""
    recrear_base(os.environ["DB_NAME"])
    if POSTGRES:
        with aplicacion.app_context():
            db.session.remove()   # suelta la base antes de vaciarla
        copiar_a_postgres(os.environ["DB_NAME"], POSTGRES, vaciar=True)
    aplicacion.config["TESTING"] = True
    with aplicacion.app_context():
        db.session.remove()
        db.engine.dispose()        # cierra conexiones viejas a la base que se acaba de borrar
    return aplicacion.test_client()


@pytest.fixture
def encargada():
    return cabecera_de(MARIA, "encargado")


@pytest.fixture
def empleado():
    return cabecera_de(JUAN, "empleado")


@pytest.fixture
def consulta_sql():
    """Ejecuta una consulta directa en la base de prueba (para verificar la auditoría, por ejemplo)."""
    def ejecutar(sql):
        with aplicacion.app_context():
            return db.session.execute(db.text(sql)).fetchall()
    return ejecutar
