"""Fase 8.4: comentarios en las alertas (encargado y empleado detectado)."""
import json

import utils.push
from config import Config
from tests.conftest import CARLOS, JUAN, cabecera_de


def alerta_de(cliente, encargada, empleado_id):
    return cliente.get(f"/api/incidents?empleado_id={empleado_id}&limit=1", headers=encargada).json["incidencias"][0]["id"]


def test_el_empleado_comenta_su_alerta_y_la_encargada_responde(cliente, empleado, encargada):
    inc = alerta_de(cliente, encargada, JUAN)
    r = cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "  Se me rompió el casco, ya pedí uno  "}, headers=empleado)
    assert r.status_code == 201 and r.json["usuario_nombre"] == "Juan Pérez" and r.json["usuario_rol"] == "empleado"
    assert r.json["texto"] == "Se me rompió el casco, ya pedí uno"           # sin espacios de más
    assert cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "Listo, ya está en el pañol"}, headers=encargada).status_code == 201

    lista = cliente.get(f"/api/incidents/{inc}/comentarios", headers=empleado).json["comentarios"]
    assert [c["usuario_nombre"] for c in lista] == ["Juan Pérez", "María Encargada"]   # en orden
    detalle = cliente.get(f"/api/incidents?empleado_id={JUAN}&limit=1", headers=encargada).json["incidencias"][0]
    assert detalle["cantidad_comentarios"] == 2


def test_el_empleado_no_comenta_alertas_ajenas(cliente, empleado, encargada):
    ajena = alerta_de(cliente, encargada, CARLOS)
    assert cliente.get(f"/api/incidents/{ajena}/comentarios", headers=empleado).status_code == 403
    assert cliente.post(f"/api/incidents/{ajena}/comentarios", json={"texto": "hola"}, headers=empleado).status_code == 403
    assert cliente.get("/api/incidents/999999/comentarios", headers=encargada).status_code == 404
    assert cliente.get(f"/api/incidents/{ajena}/comentarios").status_code == 401


def test_valida_el_texto(cliente, encargada):
    inc = alerta_de(cliente, encargada, CARLOS)
    for datos in ({}, {"texto": ""}, {"texto": "   "}, {"texto": 5}, {"texto": "x" * 501}):
        assert cliente.post(f"/api/incidents/{inc}/comentarios", json=datos, headers=encargada).status_code == 400, datos
    assert cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "x" * 500}, headers=encargada).status_code == 201


def test_queda_en_la_auditoria(cliente, encargada, consulta_sql):
    inc = alerta_de(cliente, encargada, CARLOS)
    cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "Hablé con Carlos"}, headers=encargada)
    filas = consulta_sql("SELECT usuario_id, detalle FROM auditoria WHERE accion = 'comentar_incidencia'")
    assert filas == [(2, f"Incidencia #{inc}: Hablé con Carlos")]


def test_avisa_a_la_otra_parte(cliente, encargada, monkeypatch):
    monkeypatch.setattr(Config, "VAPID_PUBLIC_KEY", "clave-publica-de-prueba")
    monkeypatch.setattr(Config, "VAPID_PRIVATE_KEY", "clave-privada-de-prueba")
    enviados = []
    monkeypatch.setattr(utils.push, "webpush", lambda subscription_info, data, **_: enviados.append(
        (subscription_info["endpoint"], json.loads(data))))
    for usuario, rol in ((JUAN, "empleado"), (2, "encargado")):
        cliente.post("/api/push/suscribir", json={"endpoint": f"https://push.ejemplo.com/{usuario}", "keys": {"p256dh": "a", "auth": "b"}},
                     headers=cabecera_de(usuario, rol))

    inc = alerta_de(cliente, encargada, JUAN)
    cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "¿Qué pasó?"}, headers=encargada)
    assert enviados == [("https://push.ejemplo.com/1", {"titulo": "María Encargada comentó una alerta", "texto": "¿Qué pasó?",
                                                         "etiqueta": f"comentario-{inc}", "url": "/app/mis-alertas"})]
    enviados.clear()
    cliente.post(f"/api/incidents/{inc}/comentarios", json={"texto": "Me olvidé los lentes"}, headers=cabecera_de(JUAN, "empleado"))
    assert [(e, m["url"]) for e, m in enviados] == [("https://push.ejemplo.com/2", "/app/incidencias")]
