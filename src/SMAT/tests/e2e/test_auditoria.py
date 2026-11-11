"""Fase 8.5: página Auditoría (quién hizo qué y cuándo)."""
from conftest import YOLO, api, esperar_texto, selector, sesion


def test_auditoria_muestra_y_filtra(base_limpia, abrir):
    # Una acción del sistema (la IA frena la máquina de la Zona D) y una de la encargada (resolver esa alerta)
    inc = api("/incidents", cabeceras=YOLO, datos={"tipo": "sin_casco", "zona_id": 4, "confianza": 0.9})
    api(f"/incidents/{inc['id']}/resolver", token=sesion("maria")["token"], metodo="PUT")

    pag = abrir("maria", "/app/auditoria")
    tabla = pag.get_by_role("table")
    assert esperar_texto(pag, "Quién hizo qué y cuándo · 2 registros")
    assert tabla.get_by_text("Máquina detenida por una alerta").is_visible()
    assert tabla.get_by_text("Resolvió una alerta").is_visible()
    assert tabla.get_by_text("Sistema", exact=True).is_visible()

    selector(pag, "Quién").select_option(label="Sistema (máquinas)")
    assert esperar_texto(pag, "Quién hizo qué y cuándo · 1 registro")
    assert not tabla.get_by_text("Resolvió una alerta").is_visible()

    selector(pag, "Quién").select_option("")
    pag.get_by_label("Buscar").fill("no existe esto")
    assert esperar_texto(pag, "No hay registros con esos filtros")
    assert not pag.errores
