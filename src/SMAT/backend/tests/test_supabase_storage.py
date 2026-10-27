"""Fotos en Supabase Storage (la versión de internet, en Render).

No se conecta a Supabase de verdad: un "Supabase falso" en memoria reemplaza a requests y guarda
lo que le mandan. Así se prueba que la app sube, entrega y borra las fotos del bucket.
"""
import pytest
import requests

from config import Config
from tests.conftest import CARLOS, cabecera_de
from tests.test_fotos import JPG, PNG, alerta_con_foto, subir_rostro
from utils import archivos

URL = "https://proyecto-falso.supabase.co"


class Respuesta:
    def __init__(self, status_code, content=b"", text=""):
        self.status_code, self.content, self.text = status_code, content, text


class SupabaseFalso:
    """Imita la API de Storage: POST guarda, GET devuelve, DELETE borra. Anota las cabeceras."""

    def __init__(self):
        self.archivos, self.buckets, self.cabeceras, self.caido = {}, set(), [], False

    def _ruta(self, url):
        return url.split("/storage/v1/object/", 1)[1]

    def post(self, url, data=None, json=None, headers=None, timeout=None):
        if self.caido:
            raise requests.ConnectionError("sin internet")
        self.cabeceras.append(headers)
        if url.endswith("/storage/v1/bucket"):
            if json["id"] in self.buckets:
                return Respuesta(400, text='{"error":"Duplicate","message":"The resource already exists"}')
            self.buckets.add(json["id"])
            return Respuesta(200)
        self.archivos[self._ruta(url)] = data
        return Respuesta(200)

    def get(self, url, headers=None, timeout=None):
        ruta = self._ruta(url)
        return Respuesta(200, self.archivos[ruta]) if ruta in self.archivos else Respuesta(404)

    def delete(self, url, headers=None, timeout=None):
        self.archivos.pop(self._ruta(url), None)
        return Respuesta(200)


@pytest.fixture
def supabase(monkeypatch):
    falso = SupabaseFalso()
    monkeypatch.setattr(Config, "SUPABASE_URL", URL)
    monkeypatch.setattr(Config, "SUPABASE_SECRET_KEY", "sb_secret_de_prueba")
    for metodo in ("post", "get", "delete"):
        monkeypatch.setattr(archivos.requests, metodo, getattr(falso, metodo))
    return falso


def test_la_evidencia_va_al_bucket_y_se_ve_desde_la_web(cliente, encargada, supabase):
    inc = alerta_con_foto(cliente).get_json()
    nombre = inc["imagen_url"].split("/")[-1]
    assert supabase.archivos[f"droid-e3d/evidencias/{nombre}"] == PNG
    assert supabase.cabeceras[-1]["apikey"] == "sb_secret_de_prueba"
    assert "Authorization" not in supabase.cabeceras[-1]   # las claves nuevas (sb_...) van solo en apikey

    foto = cliente.get("/api" + inc["imagen_url"], headers=encargada)
    assert foto.status_code == 200 and foto.data == PNG and foto.mimetype == "image/png"
    # Los permisos son los mismos que en la PC
    assert cliente.get("/api" + inc["imagen_url"], headers=cabecera_de(1, "empleado")).status_code == 403


def test_rostro_se_sube_y_se_borra_del_bucket(cliente, encargada, supabase):
    foto = subir_rostro(cliente, encargada, contenido=JPG).get_json()
    clave = "droid-e3d" + foto["url"]
    assert supabase.archivos[clave.replace("/uploads", "")] == JPG
    assert cliente.delete(f"/api/users/1/rostros/{foto['id']}", headers=encargada).status_code == 200
    assert not supabase.archivos


def test_sin_conexion_la_alerta_se_guarda_igual_sin_foto(cliente, supabase):
    supabase.caido = True
    r = alerta_con_foto(cliente)
    assert r.status_code == 201
    inc = r.get_json()
    assert inc["imagen_url"] is None and inc["maquina_detenida"] is True   # la seguridad no depende de la foto


def test_sin_conexion_el_rostro_avisa_que_falló(cliente, encargada, supabase):
    supabase.caido = True
    r = subir_rostro(cliente, encargada)
    assert r.status_code == 503 and "Probá de nuevo" in r.get_json()["error"]


def test_nombres_raros_no_llegan_a_supabase(cliente, encargada, supabase):
    assert cliente.get("/api/uploads/evidencias/..%2Fsecreto.png", headers=encargada).status_code == 404
    assert cliente.get("/api/uploads/evidencias/no-existe.png", headers=encargada).status_code == 404


def test_el_bucket_se_crea_una_vez(supabase):
    assert archivos.crear_bucket() is True
    assert archivos.crear_bucket() is True   # la segunda vez ya existe: no es un error
    assert supabase.buckets == {"droid-e3d"}


def test_clave_vieja_tambien_va_en_authorization(cliente, supabase, monkeypatch):
    monkeypatch.setattr(Config, "SUPABASE_SECRET_KEY", "eyJclave.vieja.jwt")
    alerta_con_foto(cliente, empleado_id=str(CARLOS))
    assert supabase.cabeceras[-1]["Authorization"] == "Bearer eyJclave.vieja.jwt"
