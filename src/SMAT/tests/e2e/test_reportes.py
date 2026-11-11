"""Fase 8: página Reportes (gráficos, ranking y período)."""
from conftest import api, esperar_texto, sesion


def test_reportes_muestra_graficos_y_ranking(abrir):
    pag = abrir("maria", "/app/reportes")
    assert esperar_texto(pag, "Alertas por día")
    datos = api("/reports/diario", token=sesion("maria")["token"])
    assert pag.get_by_text("en 30 días").is_visible()
    assert pag.locator(".recharts-bar-rectangle").count() >= 3          # hay columnas dibujadas
    assert pag.get_by_text(str(datos["total"]), exact=True).first.is_visible()

    # Ranking: cada empleado activo con su nivel en texto (no solo color)
    assert pag.get_by_text("Juan Pérez", exact=True).is_visible()
    assert pag.get_by_text("Bien", exact=True).first.is_visible()

    # Los mismos datos en tabla
    pag.get_by_text("Ver los datos en una tabla").click()
    assert pag.get_by_role("columnheader", name="Total").is_visible()


def test_cambiar_el_periodo(abrir):
    pag = abrir("maria", "/app/reportes")
    assert esperar_texto(pag, "en 30 días")
    pag.get_by_role("button", name="7 días").click()
    assert esperar_texto(pag, "en 7 días")
    assert pag.get_by_role("button", name="7 días").get_attribute("aria-pressed") == "true"
    assert "7 días del período" in pag.get_by_text("Días sin alertas sobre").inner_text()


def test_descargar_planilla_e_informe(abrir):
    pag = abrir("maria", "/app/reportes")
    assert esperar_texto(pag, "Alertas por día")
    with pag.expect_download() as descarga:
        pag.get_by_role("button", name="Planilla (CSV)").click()
    assert descarga.value.suggested_filename.startswith("alertas_") and descarga.value.suggested_filename.endswith(".csv")
    with open(descarga.value.path(), encoding="utf-8-sig") as archivo:      # utf-8-sig: saca el BOM
        assert archivo.read().startswith("ID;Fecha;Hora;Zona;Empleado")

    with pag.expect_download() as descarga:
        pag.get_by_role("button", name="Informe PDF").click()
    assert descarga.value.suggested_filename.startswith("informe-epp-") and descarga.value.suggested_filename.endswith(".pdf")
    with open(descarga.value.path(), "rb") as archivo:
        assert archivo.read(4) == b"%PDF"
    assert esperar_texto(pag, "Informe descargado")
