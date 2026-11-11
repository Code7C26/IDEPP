"""Fase 7.3: notificaciones push. No se manda nada a internet: se reemplaza webpush por uno
falso que anota a quién se le mandó cada mensaje."""
import json

import pytest
from pywebpush import WebPushException

import utils.push
from config import Config
from tests.conftest import CARLOS, JUAN, MARIA, YOLO, cabecera_de


class RespuestaFalsa:
    def __init__(self, codigo):
        self.status_code = codigo


@pytest.fixture
def enviados(monkeypatch):
    """Activa el push con claves de prueba y devuelve la lista de lo que se 'mandó'."""
    monkeypatch.setattr(Config, "VAPID_PUBLIC_KEY", "clave-publica-de-prueba")
    monkeypatch.setattr(Config, "VAPID_PRIVATE_KEY", "clave-privada-de-prueba")
    lista = []

    def webpush_falso(subscription_info, data, **kwargs):
        if "vencido" in subscription_info["endpoint"]:
            raise WebPushException("Gone", response=RespuestaFalsa(410))
        lista.append({"endpoint": subscription_info["endpoint"], **json.loads(data)})

    monkeypatch.setattr(utils.push, "webpush", webpush_falso)
    return lista


def suscribir(cliente, usuario_id, rol, nombre):
    datos = {"endpoint": f"https://push.ejemplo.com/{nombre}", "keys": {"p256dh": "clave-p256dh", "auth": "clave-auth"}}
    return cliente.post("/api/push/suscribir", json=datos, headers=cabecera_de(usuario_id, rol))


def test_sin_claves_vapid_avisa_que_no_esta_configurado(cliente, encargada, monkeypatch):
    monkeypatch.setattr(Config, "VAPID_PUBLIC_KEY", "")
    r = cliente.get("/api/push/clave", headers=encargada)
    assert r.status_code == 503 and "VAPID" in r.json["error"]
    # Y una alerta igual se registra, aunque no haya notificaciones
    assert cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 1}, headers=YOLO).status_code == 201


def test_clave_publica_solo_con_sesion(cliente, empleado, enviados):
    assert cliente.get("/api/push/clave").status_code == 401
    assert cliente.get("/api/push/clave", headers=empleado).json == {"clave_publica": "clave-publica-de-prueba"}


def test_suscribir_valida_los_datos(cliente, empleado, enviados):
    malos = [{}, {"endpoint": "https://push.ejemplo.com/x"}, {"endpoint": 5, "keys": {"p256dh": "a", "auth": "b"}},
             {"endpoint": "http://sin-https.com/x", "keys": {"p256dh": "a", "auth": "b"}},
             {"endpoint": "https://push.ejemplo.com/x", "keys": ["no", "es", "objeto"]}]
    for datos in malos:
        assert cliente.post("/api/push/suscribir", json=datos, headers=empleado).status_code == 400, datos


def test_alerta_avisa_a_los_encargados_y_al_empleado_detectado(cliente, enviados):
    suscribir(cliente, MARIA, "encargado", "maria")
    suscribir(cliente, CARLOS, "empleado", "carlos")
    suscribir(cliente, JUAN, "empleado", "juan")

    r = cliente.post("/api/incidents", json={"tipo": "sin_lentes", "zona_id": 2, "empleado_id": CARLOS}, headers=YOLO)
    assert r.status_code == 201

    por_destino = {e["endpoint"].rsplit("/", 1)[1]: e for e in enviados}
    assert set(por_destino) == {"maria", "carlos"}                       # Juan no tiene nada que ver
    assert por_destino["maria"]["titulo"] == "Nueva alerta: sin lentes"
    assert por_destino["maria"]["texto"] == "Zona B · Carlos Díaz · máquina detenida"
    assert por_destino["maria"]["url"] == "/app/incidencias"
    assert por_destino["carlos"]["titulo"] == "Recordá usar los lentes"
    assert por_destino["carlos"]["url"] == "/app/mis-alertas"


def test_un_navegador_pasa_al_ultimo_usuario_que_se_suscribio(cliente, enviados):
    suscribir(cliente, JUAN, "empleado", "celular-compartido")
    suscribir(cliente, CARLOS, "empleado", "celular-compartido")       # mismo celular, otro usuario
    cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 1, "empleado_id": JUAN}, headers=YOLO)
    assert enviados == []                                                # ya no es de Juan


def test_desuscribir_solo_borra_lo_propio(cliente, enviados):
    suscribir(cliente, MARIA, "encargado", "maria")
    otro = {"endpoint": "https://push.ejemplo.com/maria"}
    assert cliente.post("/api/push/desuscribir", json=otro, headers=cabecera_de(JUAN, "empleado")).status_code == 200
    assert cliente.post("/api/push/probar", headers=cabecera_de(MARIA, "encargado")).json == {"enviadas": 1}

    assert cliente.post("/api/push/desuscribir", json=otro, headers=cabecera_de(MARIA, "encargado")).status_code == 200
    assert cliente.post("/api/push/probar", headers=cabecera_de(MARIA, "encargado")).status_code == 404


def test_suscripcion_vencida_se_borra_sola(cliente, enviados):
    suscribir(cliente, MARIA, "encargado", "vencido")                   # el servicio de push responde 410
    suscribir(cliente, MARIA, "encargado", "maria")
    assert cliente.post("/api/push/probar", headers=cabecera_de(MARIA, "encargado")).json == {"enviadas": 2}
    assert cliente.post("/api/push/probar", headers=cabecera_de(MARIA, "encargado")).json == {"enviadas": 1}
    assert [e["titulo"] for e in enviados] == ["DROID-E3D: notificación de prueba"] * 2
