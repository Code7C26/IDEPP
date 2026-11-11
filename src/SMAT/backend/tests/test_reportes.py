"""Fase 8.1: reportes diario y ranking de cumplimiento.
Se cargan alertas en un período fijo del pasado (1 al 10 de enero de 2025) para saber el resultado exacto."""
from datetime import date, timedelta

import pytest

from tests.conftest import aplicacion, db

PERIODO = "desde=2025-01-01&hasta=2025-01-10"     # 10 días


@pytest.fixture
def enero(cliente):
    """Juan: 3 alertas en 2 días · Carlos: 1 (el último día, a las 23:30) · 1 sin identificar ·
    y 2 alertas justo afuera del período, que no deben contar."""
    filas = [("sin_casco", "2025-01-02 09:00", 1, 1), ("sin_lentes", "2025-01-02 15:00", 1, 1),
             ("sin_casco", "2025-01-05 10:00", 1, 1), ("sin_guantes", "2025-01-10 23:30", 2, 4),
             ("sin_chaleco", "2025-01-03 11:00", 4, None),
             ("sin_casco", "2024-12-31 23:59", 1, 1), ("sin_casco", "2025-01-11 00:00", 1, 1)]
    with aplicacion.app_context():
        for tipo, momento, zona, empleado in filas:
            db.session.execute(db.text("INSERT INTO incidencias (tipo, timestamp, zona_id, empleado_id, confianza) "
                                       "VALUES (:t, :m, :z, :e, 0.9)"), {"t": tipo, "m": momento, "z": zona, "e": empleado})
        db.session.commit()
    return cliente


def test_solo_el_encargado(cliente, empleado):
    for ruta in ("/api/reports/diario", "/api/reports/ranking"):
        assert cliente.get(ruta).status_code == 401
        assert cliente.get(ruta, headers=empleado).status_code == 403


def test_diario_cuenta_por_dia_tipo_y_zona(enero, encargada):
    r = enero.get(f"/api/reports/diario?{PERIODO}", headers=encargada).json
    assert len(r["dias"]) == 10 and r["dias"][0]["fecha"] == "2025-01-01"
    assert r["total"] == 5 and r["activas"] == 5 and r["resueltas"] == 0
    assert r["dias"][1] == {"fecha": "2025-01-02", "sin_casco": 1, "sin_guantes": 0, "sin_lentes": 1, "sin_chaleco": 0, "total": 2}
    assert r["dias"][9]["sin_guantes"] == 1                                  # "hasta" incluye todo el último día
    assert {t["tipo"]: t["total"] for t in r["por_tipo"]} == {"sin_casco": 2, "sin_guantes": 1, "sin_lentes": 1, "sin_chaleco": 1}
    assert {z["zona"]: z["total"] for z in r["por_zona"]} == {"Zona A": 3, "Zona B": 1, "Zona C": 0, "Zona D": 1}
    assert r["paradas_maquina"] == 0


def test_ranking_de_empleados_y_zonas(enero, encargada):
    r = enero.get(f"/api/reports/ranking?{PERIODO}", headers=encargada).json
    assert r["dias"] == 10 and r["alertas_sin_identificar"] == 1
    empleados = [(e["nombre"], e["alertas"], e["dias_con_alerta"], e["cumplimiento"]) for e in r["empleados"]]
    assert empleados == [("Ana Martínez", 0, 0, 100), ("Lucía Gómez", 0, 0, 100), ("Pedro Sosa", 0, 0, 100),
                         ("Sofía Romero", 0, 0, 100), ("Carlos Díaz", 1, 1, 90), ("Juan Pérez", 3, 2, 80)]
    zonas = [(z["nombre"], z["cumplimiento"]) for z in r["zonas"]]
    assert zonas == [("Zona C", 100), ("Zona B", 90), ("Zona D", 90), ("Zona A", 80)]   # empate: por nombre
    assert next(z for z in r["zonas"] if z["nombre"] == "Zona A")["empleados"] == 2      # Juan y Lucía


def test_por_defecto_son_los_ultimos_30_dias(cliente, encargada):
    r = cliente.get("/api/reports/diario", headers=encargada).json
    hoy = date.today()
    assert len(r["dias"]) == 30 and r["hasta"] == hoy.isoformat() and r["desde"] == (hoy - timedelta(days=29)).isoformat()
    # Coincide con la lista de incidencias filtrada por las mismas fechas
    lista = cliente.get(f"/api/incidents?desde={r['desde']}&hasta={r['hasta']}&limit=1", headers=encargada).json
    assert r["total"] == lista["total"] > 0


def test_periodo_invalido(cliente, encargada):
    for consulta in ("desde=2025-13-01", "hasta=ayer", "desde=2025-01-10&hasta=2025-01-01", "desde=2020-01-01&hasta=2025-01-01"):
        r = cliente.get(f"/api/reports/diario?{consulta}", headers=encargada)
        assert r.status_code == 400 and r.json["error"], consulta


# ---------- 8.3: descargas ----------

def test_csv_para_excel(enero, encargada, consulta_sql):
    r = enero.get(f"/api/reports/incidencias.csv?{PERIODO}", headers=encargada)
    assert r.status_code == 200 and r.mimetype == "text/csv"
    assert 'filename="alertas_2025-01-01_a_2025-01-10.csv"' in r.headers["Content-Disposition"]
    texto = r.data.decode("utf-8")
    assert texto.startswith("\ufeff")                       # BOM: Excel reconoce los acentos
    filas = texto.lstrip("\ufeff").strip().split("\r\n")
    assert filas[0] == "ID;Fecha;Hora;Zona;Empleado;Legajo;Falta;Confianza (%);Estado;Resuelta por;Resuelta el"
    assert len(filas) == 1 + 5                              # las 5 alertas del período, de la más vieja a la más nueva
    assert filas[1].split(";")[1:] == ["02/01/2025", "09:00", "Zona A", "Juan Pérez", "L-001", "Sin casco", "90", "activa", "", ""]
    assert "No identificado" in filas[3]
    assert consulta_sql("SELECT detalle FROM auditoria WHERE accion = 'exportar_csv'")[0][0] == \
        "Alertas del 01/01/2025 al 10/01/2025 (5 filas)"


def test_csv_no_deja_pasar_formulas(enero, encargada):
    from routes.reports import celda_segura
    assert celda_segura("=1+2") == "'=1+2" and celda_segura("@SUMA") == "'@SUMA"
    assert celda_segura("Juan") == "Juan" and celda_segura(None) == "" and celda_segura(90) == "90"
    with aplicacion.app_context():
        db.session.execute(db.text("UPDATE usuarios SET nombre = '=1+2' WHERE id = 1"))
        db.session.commit()
    texto = enero.get(f"/api/reports/incidencias.csv?{PERIODO}", headers=encargada).data.decode("utf-8")
    assert ";'=1+2;" in texto


def test_pdf_mensual(enero, encargada, consulta_sql):
    r = enero.get("/api/reports/mensual.pdf?mes=2025-01", headers=encargada)
    assert r.status_code == 200 and r.mimetype == "application/pdf"
    assert r.data.startswith(b"%PDF") and len(r.data) > 3000
    assert 'filename="informe-epp-2025-01.pdf"' in r.headers["Content-Disposition"]
    assert consulta_sql("SELECT detalle FROM auditoria WHERE accion = 'exportar_pdf'")[0][0] == "Informe mensual de enero de 2025"


def test_pdf_valida_el_mes(cliente, encargada, empleado):
    assert cliente.get("/api/reports/mensual.pdf?mes=2025-13", headers=encargada).status_code == 400
    assert cliente.get("/api/reports/mensual.pdf?mes=2999-01", headers=encargada).status_code == 400
    assert cliente.get("/api/reports/mensual.pdf", headers=empleado).status_code == 403
    assert cliente.get("/api/reports/incidencias.csv", headers=empleado).status_code == 403
    assert cliente.get("/api/reports/mensual.pdf", headers=encargada).status_code == 200   # mes actual
