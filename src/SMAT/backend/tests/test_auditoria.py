"""Fase 8.5: listado de la auditoría con filtros (solo el encargado)."""
import pytest

from tests.conftest import YOLO


@pytest.fixture
def con_acciones(cliente, encargada):
    """Tres registros: la IA frena la máquina de la Zona D (lo hace el "Sistema"),
    María resuelve esa alerta y después la comenta."""
    inc = cliente.post("/api/incidents", json={"tipo": "sin_casco", "zona_id": 4, "confianza": 0.9}, headers=YOLO).json
    assert inc["maquina_detenida"]
    cliente.put(f"/api/incidents/{inc['id']}/resolver", headers=encargada)
    cliente.post(f"/api/incidents/{inc['id']}/comentarios", json={"texto": "Charlado con el equipo"}, headers=encargada)
    return cliente


def acciones(respuesta):
    return [r["accion"] for r in respuesta.json["registros"]]


def test_solo_el_encargado(cliente, empleado):
    assert cliente.get("/api/auditoria").status_code == 401
    assert cliente.get("/api/auditoria", headers=empleado).status_code == 403


def test_lista_del_mas_nuevo_al_mas_viejo(con_acciones, encargada):
    r = con_acciones.get("/api/auditoria", headers=encargada)
    assert acciones(r) == ["comentar_incidencia", "resolver_incidencia", "parada_maquina"]
    assert r.json["total"] == 3
    assert r.json["acciones"] == ["comentar_incidencia", "parada_maquina", "resolver_incidencia"]
    assert r.json["usuarios"] == [{"id": 2, "nombre": "María Encargada"}]
    assert r.json["registros"][2]["usuario_nombre"] == "Sistema"


def test_filtros(con_acciones, encargada):
    def pedir(consulta):
        return con_acciones.get(f"/api/auditoria?{consulta}", headers=encargada)
    assert acciones(pedir("accion=resolver_incidencia")) == ["resolver_incidencia"]
    assert acciones(pedir("usuario_id=sistema")) == ["parada_maquina"]
    assert acciones(pedir("usuario_id=2")) == ["comentar_incidencia", "resolver_incidencia"]
    assert acciones(pedir("q=DETENIDA")) == ["parada_maquina"]                   # sin importar mayúsculas
    assert acciones(pedir("q=zona d")) == ["resolver_incidencia", "parada_maquina"]
    assert pedir("hasta=2000-01-01").json["total"] == 0
    assert pedir("limit=2&page=2").json["registros"][0]["accion"] == "parada_maquina"
    for malo in ("usuario_id=abc", "desde=ayer", "hasta=2026-02-30"):
        assert pedir(malo).status_code == 400, malo
