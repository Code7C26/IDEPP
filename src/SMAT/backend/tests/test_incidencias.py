"""Incidencias: permisos por rol, filtros, estadísticas, resolver y alta desde YOLO."""
import pytest

from tests.conftest import JUAN, MARIA, YOLO


def test_el_encargado_ve_todas(cliente, encargada):
    assert cliente.get("/api/incidents?limit=200", headers=encargada).json["total"] == 40


def test_el_empleado_ve_solo_las_suyas_aunque_pida_otras(cliente, empleado):
    for url in ("/api/incidents?limit=200", "/api/incidents?empleado_id=3&limit=200"):
        datos = cliente.get(url, headers=empleado).json
        assert datos["total"] > 0
        assert all(i["empleado_id"] == JUAN for i in datos["incidencias"])


def test_filtros_y_paginado(cliente, encargada):
    datos = cliente.get("/api/incidents?zona_id=2&estado=activa", headers=encargada).json
    assert all(i["zona_id"] == 2 and i["estado"] == "activa" for i in datos["incidencias"])
    por_nombre = cliente.get("/api/incidents?zona=Zona%20C&limit=200", headers=encargada).json
    assert por_nombre["total"] > 0 and all(i["zona"] == "Zona C" for i in por_nombre["incidencias"])
    pagina = cliente.get("/api/incidents?limit=10&page=2", headers=encargada).json
    assert len(pagina["incidencias"]) == 10 and pagina["page"] == 2


def test_fecha_invalida(cliente, encargada):
    assert cliente.get("/api/incidents?desde=ayer", headers=encargada).status_code == 400


def test_estadisticas_solo_para_el_encargado(cliente, encargada, empleado):
    assert cliente.get("/api/stats", headers=empleado).status_code == 403
    s = cliente.get("/api/stats", headers=encargada).json
    assert s["incidencias_activas"] == 4 and s["empleados_activos"] == 6


def test_resolver_varias(cliente, encargada, empleado):
    url = "/api/incidents/resolver-varias"
    activas = [i["id"] for i in cliente.get("/api/incidents?estado=activa&limit=200", headers=encargada).json["incidencias"]]
    assert len(activas) >= 3

    assert cliente.post(url, json={"ids": activas}).status_code == 401
    assert cliente.post(url, json={"ids": activas}, headers=empleado).status_code == 403
    for cuerpo in ({}, {"ids": []}, {"ids": "1"}, {"ids": [True]}, {"ids": [0]}, {"ids": ["1"]}, {"ids": list(range(1, 202))}):
        assert cliente.post(url, json=cuerpo, headers=encargada).status_code == 400

    # Resuelve las pedidas, una sola vez aunque venga repetida, y quedan a nombre del encargado
    r = cliente.post(url, json={"ids": [activas[0], activas[0], activas[1]]}, headers=encargada)
    assert r.status_code == 200 and r.json == {"resueltas": 2, "omitidas": 0}
    resueltas = cliente.get("/api/incidents?estado=resuelta&limit=200", headers=encargada).json["incidencias"]
    nuevas = [i for i in resueltas if i["id"] in activas[:2]]
    assert len(nuevas) == 2 and all(i["resuelta_por"] == MARIA and i["resuelta_at"] for i in nuevas)

    # Las que ya estaban resueltas o no existen se omiten sin error
    r = cliente.post(url, json={"ids": [activas[0], activas[2], 99999]}, headers=encargada)
    assert r.json == {"resueltas": 1, "omitidas": 2}


def test_resolver_varias_no_reactiva_la_maquina_y_queda_en_la_auditoria(cliente, encargada):
    inc = cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 1, "confianza": 0.9}, headers=YOLO).json
    assert inc["maquina_detenida"] is True
    cliente.post("/api/incidents/resolver-varias", json={"ids": [inc["id"]]}, headers=encargada)
    zona = cliente.get("/api/zones/1", headers=encargada).json
    assert zona["maquina_activa"] is False
    auditoria = cliente.get("/api/auditoria?accion=resolver_incidencia", headers=encargada).json["registros"]
    assert any(f"#{inc['id']} " in r["detalle"] for r in auditoria)


def test_stats_informa_la_alerta_mas_vieja_sin_resolver(cliente, encargada):
    activas = cliente.get("/api/incidents?estado=activa&orden=timestamp&limit=200", headers=encargada).json["incidencias"]
    assert cliente.get("/api/stats", headers=encargada).json["activa_mas_antigua"] == activas[0]["timestamp"]
    cliente.post("/api/incidents/resolver-varias", json={"ids": [i["id"] for i in activas]}, headers=encargada)
    assert cliente.get("/api/stats", headers=encargada).json["activa_mas_antigua"] is None


def test_resolver(cliente, encargada, empleado):
    activa = cliente.get("/api/incidents?estado=activa&limit=1", headers=encargada).json["incidencias"][0]["id"]
    assert cliente.put(f"/api/incidents/{activa}/resolver", headers=empleado).status_code == 403
    r = cliente.put(f"/api/incidents/{activa}/resolver", headers=encargada)
    assert r.status_code == 200
    assert r.json["estado"] == "resuelta" and r.json["resuelta_por_nombre"] == "María Encargada"
    assert cliente.put(f"/api/incidents/{activa}/resolver", headers=encargada).status_code == 409


NUEVA = {"tipo": "sin_casco", "zona_id": 1, "empleado_id": 1, "confianza": 0.9}


def test_alta_desde_yolo_exige_la_clave(cliente):
    assert cliente.post("/api/incidents", json=NUEVA).status_code == 401
    assert cliente.post("/api/incidents", json=NUEVA, headers={"X-API-KEY": "mala"}).status_code == 401
    assert cliente.post("/api/incidents", json=NUEVA, headers=YOLO).status_code == 201


def test_alta_por_nombre_de_zona(cliente):
    assert cliente.post("/api/incidents", json={"tipo": "sin_lentes", "zona": "Zona A"}, headers=YOLO).status_code == 201


@pytest.mark.parametrize("cambio", [
    {"tipo": "sin_botas"}, {"zona_id": 99}, {"confianza": 5}, {"empleado_id": 999},
])
def test_alta_con_datos_invalidos(cliente, cambio):
    assert cliente.post("/api/incidents", json={**NUEVA, **cambio}, headers=YOLO).status_code == 400


def test_orden_por_columna(cliente, encargada):
    def lista(orden):
        return cliente.get(f"/api/incidents?limit=200&orden={orden}", headers=encargada).json["incidencias"]
    confianzas = [i["confianza"] for i in lista("confianza")]
    assert confianzas == sorted(confianzas)
    assert [i["confianza"] for i in lista("-confianza")] == sorted(confianzas, reverse=True)
    zonas = [i["zona"] for i in lista("zona")]
    assert zonas == sorted(zonas)
    nombres = [i["empleado_nombre"] for i in lista("-empleado") if i["empleado_id"]]
    assert nombres == sorted(nombres, reverse=True)
    fechas = [i["timestamp"] for i in lista("-timestamp")]
    assert fechas == sorted(fechas, reverse=True)
    assert cliente.get("/api/incidents?orden=contrasena", headers=encargada).status_code == 400


def test_paginado_ordenado_no_repite_filas(cliente, encargada):
    ids = []
    for pagina in (1, 2, 3, 4):
        ids += [i["id"] for i in cliente.get(f"/api/incidents?limit=10&page={pagina}&orden=tipo", headers=encargada).json["incidencias"]]
    assert len(ids) == 40 and len(set(ids)) == 40


def test_busqueda_por_empleado_o_zona(cliente, encargada, empleado):
    por_persona = cliente.get("/api/incidents?q=carl&limit=200", headers=encargada).json
    assert por_persona["total"] > 0 and all(i["empleado_nombre"] == "Carlos Díaz" for i in por_persona["incidencias"])
    por_zona = cliente.get("/api/incidents?q=zona%20d&limit=200", headers=encargada).json
    assert por_zona["total"] > 0 and all(i["zona"] == "Zona D" for i in por_zona["incidencias"])
    # el empleado sigue viendo solo lo suyo aunque busque a otro
    assert cliente.get("/api/incidents?q=carl", headers=empleado).json["total"] == 0


def test_estadisticas_con_tendencia_y_serie(cliente, encargada):
    s = cliente.get("/api/stats", headers=encargada).json
    serie = [d["total"] for d in s["serie_14_dias"]]
    assert len(serie) == 14
    assert s["incidencias_hoy"] == serie[-1] and s["incidencias_ayer"] == serie[-2]
    assert s["incidencias_semana"] == sum(serie[7:]) and s["incidencias_semana_anterior"] == sum(serie[:7])
    # la serie suma lo mismo que contar en la base las alertas de esos 14 días
    from datetime import date, timedelta
    desde = (date.today() - timedelta(days=13)).isoformat()
    assert sum(serie) == cliente.get(f"/api/incidents?desde={desde}&limit=1", headers=encargada).json["total"]
