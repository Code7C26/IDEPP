"""Zonas y usuarios (CRUD del encargado) y auditoría."""
from tests.conftest import MARIA, ROBOT, YOLO, aplicacion, db


def test_zonas_se_leen_con_sesion_o_con_clave_de_un_programa(cliente, empleado):
    assert len(cliente.get("/api/zones", headers=empleado).json["zonas"]) == 4
    assert cliente.get("/api/zones", headers=YOLO).status_code == 200
    assert cliente.get("/api/zones", headers=ROBOT).status_code == 200
    assert cliente.get("/api/zones", headers={"X-API-KEY": "mala"}).status_code == 401
    assert cliente.get("/api/zones").status_code == 401


def test_crud_de_zonas(cliente, encargada, empleado):
    assert cliente.post("/api/zones", json={"nombre": "Z"}, headers=empleado).status_code == 403
    r = cliente.post("/api/zones", json={"nombre": "Zona E", "maquina": "Torno", "epp_requerido": ["casco", "lentes"], "grilla_x": 6}, headers=encargada)
    assert r.status_code == 201 and r.json["epp_requerido"] == ["casco", "lentes"]
    assert cliente.post("/api/zones", json={"nombre": "Zona E"}, headers=encargada).status_code == 400
    assert cliente.post("/api/zones", json={"nombre": "Otra", "epp_requerido": ["botas"]}, headers=encargada).status_code == 400
    # Desde el 17/11 se controlan casco, chaleco y lentes (decisión 011): los guantes ya no se aceptan
    assert cliente.post("/api/zones", json={"nombre": "Otra", "epp_requerido": ["casco", "guantes"]}, headers=encargada).status_code == 400
    assert cliente.put(f"/api/zones/{r.json['id']}", json={"maquina": "Fresadora"}, headers=encargada).json["maquina"] == "Fresadora"
    assert cliente.delete("/api/zones/1", headers=encargada).status_code == 409        # tiene incidencias
    assert cliente.delete(f"/api/zones/{r.json['id']}", headers=encargada).status_code == 200


def test_una_zona_vieja_con_guantes_deja_de_pedirlos(cliente, encargada):
    """Una base de antes del 17/11 puede tener zonas con guantes: se leen sin ellos, y al guardarla quedan afuera."""
    with aplicacion.app_context():
        db.session.execute(db.text("UPDATE zonas SET epp_requerido = 'casco,guantes,lentes' WHERE id = 1"))
        db.session.commit()
    zona = next(z for z in cliente.get("/api/zones", headers=encargada).json["zonas"] if z["id"] == 1)
    assert zona["epp_requerido"] == ["casco", "lentes"]
    assert cliente.put("/api/zones/1", json={"epp_requerido": zona["epp_requerido"]}, headers=encargada).status_code == 200


def test_crud_de_usuarios(cliente, encargada, empleado):
    assert cliente.get("/api/users", headers=empleado).status_code == 403
    assert len(cliente.get("/api/users", headers=encargada).json["usuarios"]) == 7
    nuevo = {"usuario": "nuevo", "contrasena": "clave123", "nombre": "Nuevo", "rol": "empleado", "legajo": "L-900", "zona_id": 3}
    r = cliente.post("/api/users", json=nuevo, headers=encargada)
    assert r.status_code == 201 and r.json["zona"] == "Zona C"
    assert cliente.post("/api/users", json=nuevo, headers=encargada).status_code == 400            # usuario repetido
    assert cliente.post("/api/users", json={**nuevo, "usuario": "otro", "contrasena": "123"}, headers=encargada).status_code == 400
    assert cliente.post("/api/login", json={"usuario": "nuevo", "contrasena": "clave123"}).status_code == 200
    assert cliente.put(f"/api/users/{r.json['id']}", json={"zona_id": 4}, headers=encargada).json["zona"] == "Zona D"
    assert cliente.delete(f"/api/users/{r.json['id']}", headers=encargada).json["activo"] is False


def test_el_encargado_no_se_puede_dar_de_baja(cliente, encargada):
    assert cliente.delete(f"/api/users/{MARIA}", headers=encargada).status_code == 400
    assert cliente.put(f"/api/users/{MARIA}", json={"rol": "empleado"}, headers=encargada).status_code == 400


def test_las_acciones_del_encargado_quedan_auditadas(cliente, encargada, consulta_sql):
    activa = cliente.get("/api/incidents?estado=activa&limit=1", headers=encargada).json["incidencias"][0]["id"]
    cliente.put(f"/api/incidents/{activa}/resolver", headers=encargada)
    cliente.post("/api/zones", json={"nombre": "Zona Auditada", "grilla_x": 8}, headers=encargada)
    cliente.delete("/api/users/3", headers=encargada)
    acciones = [f[0] for f in consulta_sql("SELECT accion FROM auditoria WHERE usuario_id = 2")]
    assert {"resolver_incidencia", "crear_zona", "baja_usuario"} <= set(acciones)
