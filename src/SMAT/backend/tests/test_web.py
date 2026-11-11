"""Flask sirve la web compilada (como en PythonAnywhere): archivos, páginas de React y la API sin mezclarse."""
import pytest

from config import Config


@pytest.fixture
def web(cliente, tmp_path, monkeypatch):
    """Una web compilada de mentira (index.html, un JS y el manifest) y, al lado de su carpeta,
    un config.py "secreto" que nadie tiene que poder leer desde el navegador."""
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><title>DROID-E3D</title>", encoding="utf-8")
    (dist / "assets" / "app.js").write_text("console.log('hola')", encoding="utf-8")
    (dist / "manifest.webmanifest").write_text("{}", encoding="utf-8")
    (tmp_path / "config.py").write_text("class Config: CLAVE = 'secreta'", encoding="utf-8")
    monkeypatch.setattr(Config, "WEB_DIST", str(dist))
    return cliente


def test_paginas_de_react_devuelven_index(web):
    for ruta in ("/", "/app/panel", "/como-funciona", "/app/reportes?desde=2026-01-01"):
        r = web.get(ruta)
        assert r.status_code == 200 and b"DROID-E3D" in r.data, ruta


def test_archivos_de_la_web(web):
    assert web.get("/assets/app.js").data == b"console.log('hola')"
    assert web.get("/manifest.webmanifest").mimetype == "application/manifest+json"


def test_la_api_no_se_mezcla_con_la_web(web):
    assert web.get("/api/health").json["status"] == "ok"
    r = web.get("/api/no-existe")
    assert r.status_code == 404 and r.is_json                       # JSON, no el index.html


def test_no_se_puede_salir_de_la_carpeta_de_la_web(web):
    # Nadie puede pedir otros archivos del servidor (como el config.py o el .env) armando la dirección
    for ruta in ("/../config.py", "/%2e%2e/config.py", "/..%2fconfig.py", "/assets/../../config.py", "/assets/..%2f..%2fconfig.py"):
        assert b"secreta" not in web.get(ruta).data, ruta


def test_sin_web_compilada_solo_api(cliente, tmp_path, monkeypatch):
    monkeypatch.setattr(Config, "WEB_DIST", str(tmp_path / "no-existe"))
    r = cliente.get("/app/panel")
    assert r.status_code == 404 and r.is_json
