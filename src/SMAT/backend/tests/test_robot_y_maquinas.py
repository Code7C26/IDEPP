"""Robot (ESP32 y control desde la web) y máquinas (parada automática, reactivación, parada manual)."""
from datetime import datetime, timedelta

from tests.conftest import ROBOT, YOLO


def comando(cliente):
    return cliente.get("/api/robot/comando-pendiente", headers=ROBOT).json["comando"]


def test_el_esp32_necesita_su_propia_clave(cliente):
    assert cliente.get("/api/robot/comando-pendiente").status_code == 401
    assert cliente.get("/api/robot/comando-pendiente", headers=YOLO).status_code == 401
    assert cliente.get("/api/robot/comando-pendiente", headers=ROBOT).json == {"comando": None, "estado": "detenido"}


def test_una_orden_se_repite_hasta_que_el_robot_la_confirma(cliente, encargada):
    cliente.post("/api/robot/comando", json={"comando": "iniciar"}, headers=encargada)
    assert comando(cliente) == "iniciar"
    cliente.post("/api/robot/reporte", json={"estado": "recorriendo", "bateria": 87, "zona_actual_id": 2}, headers=ROBOT)
    assert comando(cliente) == "iniciar"                       # todavía no la confirmó
    r = cliente.post("/api/robot/reporte", json={"comando_ejecutado": "iniciar"}, headers=ROBOT).json
    assert r == {"comando": None, "estado": "recorriendo"}


def test_el_reporte_alcanza_para_recibir_y_confirmar_ordenes(cliente, encargada):
    """robot_droid.ino usa solo POST /robot/reporte: la respuesta trae la orden y ahí mismo la confirma."""
    cliente.post("/api/robot/comando", json={"comando": "iniciar"}, headers=encargada)
    assert cliente.post("/api/robot/reporte", json={}, headers=ROBOT).json["comando"] == "iniciar"
    r = cliente.post("/api/robot/reporte", json={"estado": "recorriendo", "comando_ejecutado": "iniciar"}, headers=ROBOT).json
    assert r["comando"] is None and r["estado"] == "recorriendo"
    # Un reporte sin "estado" no pisa la emergencia que acaba de mandar el encargado
    cliente.post("/api/robot/comando", json={"comando": "emergencia"}, headers=encargada)
    r = cliente.post("/api/robot/reporte", json={"zona_actual_id": 1}, headers=ROBOT).json
    assert r["comando"] == "emergencia" and r["estado"] == "emergencia"


def test_reporte_con_datos_invalidos(cliente):
    for datos in ({"bateria": 150}, {"estado": "volando"}, {"zona_actual_id": 99}):
        assert cliente.post("/api/robot/reporte", json=datos, headers=ROBOT).status_code == 400


def test_el_robot_figura_desconectado_si_no_reporta_en_10_segundos(cliente, encargada):
    from app import app
    from models import db, obtener_robot
    cliente.post("/api/robot/reporte", json={"estado": "pausado"}, headers=ROBOT)
    assert cliente.get("/api/robot/estado", headers=encargada).json["conectado"] is True
    with app.app_context():                                       # se simula que pasaron 11 s
        obtener_robot().ultima_conexion = datetime.now() - timedelta(seconds=11)
        db.session.commit()
    assert cliente.get("/api/robot/estado", headers=encargada).json["conectado"] is False


def test_ordenes_desde_la_web_y_reglas_de_la_emergencia(cliente, encargada, empleado):
    assert cliente.get("/api/robot/estado", headers=empleado).status_code == 403
    assert cliente.post("/api/robot/comando", json={"comando": "pausar"}, headers=empleado).status_code == 403
    assert cliente.post("/api/robot/comando", json={"comando": "volar"}, headers=encargada).status_code == 400
    r = cliente.post("/api/robot/comando", json={"comando": "emergencia"}, headers=encargada).json
    assert r["estado"] == "emergencia"                            # se ve enseguida, sin esperar al robot
    assert cliente.post("/api/robot/comando", json={"comando": "iniciar"}, headers=encargada).status_code == 409
    assert cliente.post("/api/robot/comando", json={"comando": "detener"}, headers=encargada).status_code == 200


def test_ruta(cliente, encargada, empleado):
    assert [p["zona_id"] for p in cliente.get("/api/robot/ruta", headers=encargada).json["ruta"]] == [1, 2, 3, 4]
    assert len(cliente.get("/api/robot/ruta", headers=ROBOT).json["ruta"]) == 4
    assert cliente.get("/api/robot/ruta").status_code == 401
    nueva = {"ruta": [{"zona_id": 3, "tiempo_espera_seg": 20}, {"zona_id": 1}]}
    assert cliente.put("/api/robot/ruta", json=nueva, headers=empleado).status_code == 403
    r = cliente.put("/api/robot/ruta", json=nueva, headers=encargada).json["ruta"]
    assert [(p["orden"], p["zona_id"], p["tiempo_espera_seg"]) for p in r] == [(1, 3, 20), (2, 1, 30)]
    for invalida in ({"ruta": []}, {"ruta": [{"zona_id": 99}]}, {"ruta": [{"zona_id": 1, "tiempo_espera_seg": 1}]}):
        assert cliente.put("/api/robot/ruta", json=invalida, headers=encargada).status_code == 400
    assert len(cliente.get("/api/robot/ruta", headers=encargada).json["ruta"]) == 2   # una ruta inválida no borra la anterior


def test_video(cliente, encargada):
    assert cliente.put("/api/robot/video", json={"url_video": "http://192.168.0.20:8080/video"}, headers=encargada).status_code == 200
    assert cliente.put("/api/robot/video", json={"url_video": "ftp://x"}, headers=encargada).status_code == 400
    for mala in ("https://172.100.177.92:92:8080", "http://", "http://mi pc:8080/video", "http://x/" + "a" * 260):
        assert cliente.put("/api/robot/video", json={"url_video": mala}, headers=encargada).status_code == 400, mala
    assert cliente.put("/api/robot/video", json={"url_video": ""}, headers=encargada).status_code == 200   # vacía = sin video


def maquina_activa(cliente, zona):
    return cliente.get(f"/api/zones/{zona}/maquina", headers=ROBOT).json["maquina_activa"]


def test_una_falta_detiene_la_maquina_de_la_zona(cliente):
    assert maquina_activa(cliente, 2) is True
    r = cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 2}, headers=YOLO).json
    assert r["maquina_detenida"] is True and maquina_activa(cliente, 2) is False
    otra = cliente.post("/api/incidents", json={"tipo": "sin_lentes", "zona_id": 2}, headers=YOLO).json
    assert otra["maquina_detenida"] is False                       # ya estaba detenida


def test_zona_sin_maquina_no_se_detiene_ni_se_reactiva(cliente, encargada):
    zona = cliente.post("/api/zones", json={"nombre": "Zona Libre", "grilla_x": 12}, headers=encargada).json["id"]
    assert cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": zona}, headers=YOLO).json["maquina_detenida"] is False
    assert cliente.put(f"/api/zones/{zona}/reactivar", headers=encargada).status_code == 400


def test_solo_el_encargado_reactiva_y_queda_auditado(cliente, encargada, empleado, consulta_sql):
    cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 2}, headers=YOLO)
    assert cliente.put("/api/zones/2/reactivar", headers=empleado).status_code == 403
    r = cliente.put("/api/zones/2/reactivar", headers=encargada).json
    assert r["maquina_activa"] is True and r["alertas_activas"] >= 1
    assert maquina_activa(cliente, 2) is True
    assert cliente.put("/api/zones/2/reactivar", headers=encargada).status_code == 409
    filas = consulta_sql("SELECT accion, usuario_id FROM auditoria WHERE accion LIKE '%maquina%'")
    assert ("parada_maquina", None) in filas and ("reactivar_maquina", 2) in filas


def test_parada_manual(cliente, encargada, empleado):
    assert cliente.put("/api/zones/2/detener", headers=empleado).status_code == 403
    assert cliente.put("/api/zones/2/detener", headers=encargada).json["maquina_activa"] is False
    assert cliente.put("/api/zones/2/detener", headers=encargada).status_code == 409
    assert maquina_activa(cliente, 2) is False


def test_rostros_por_ahora_vacio_y_con_clave(cliente):
    assert cliente.get("/api/rostros", headers=YOLO).json == {"rostros": []}
    assert cliente.get("/api/rostros").status_code == 401
