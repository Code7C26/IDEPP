"""Fase 7: avisos en tiempo real (banner que aparece solo + sonido de alertas)."""
from conftest import YOLO, api, esperar_texto


def nueva_alerta(tipo, zona_id, empleado_id):
    """Hace lo mismo que la IA cuando detecta a alguien sin EPP."""
    return api("/incidents", cabeceras=YOLO, datos={"tipo": tipo, "zona_id": zona_id, "empleado_id": empleado_id, "confianza": 0.9})


def test_alerta_nueva_aparece_sola_y_lleva_a_incidencias(base_limpia, abrir):
    pag = abrir("maria", "/app/panel")
    pag.wait_for_timeout(3500)                                  # las alertas que ya había no se avisan
    assert not pag.get_by_text("Nueva alerta", exact=True).is_visible()

    nueva_alerta("sin_lentes", 2, 4)                            # Carlos Díaz, Zona B
    assert esperar_texto(pag, "Nueva alerta", 8)
    banner = pag.get_by_role("alert").filter(has_text="Nueva alerta")
    assert "Sin lentes en Zona B · Carlos Díaz" in banner.inner_text()
    assert banner.get_by_role("button", name="Activar sonido").is_visible()   # el sonido arranca apagado

    banner.get_by_role("button", name="Ver").click()
    pag.wait_for_url("**/app/incidencias")
    assert not pag.get_by_text("Nueva alerta", exact=True).is_visible()


def test_el_empleado_solo_se_entera_de_las_suyas(base_limpia, abrir):
    pag = abrir("juan", "/app")
    pag.wait_for_timeout(3500)
    nueva_alerta("sin_casco", 1, 3)                             # Lucía, no Juan
    pag.wait_for_timeout(4500)
    assert not pag.get_by_text("Nueva alerta", exact=True).is_visible()

    nueva_alerta("sin_guantes", 1, 1)                           # Juan
    assert esperar_texto(pag, "Nueva alerta", 8)
    assert "Sin guantes en Zona A" in pag.get_by_role("alert").filter(has_text="Nueva alerta").inner_text()


def test_la_campana_activa_el_sonido_y_lo_recuerda(abrir):
    pag = abrir("maria", "/app/panel")
    campana = pag.get_by_role("button", name="Sonido de alertas")
    assert campana.get_attribute("aria-pressed") == "false"
    campana.click()
    assert campana.get_attribute("aria-pressed") == "true"
    assert pag.evaluate("localStorage.getItem('sonido')") == "si"
    pag.reload()
    assert pag.get_by_role("button", name="Sonido de alertas").get_attribute("aria-pressed") == "true"
