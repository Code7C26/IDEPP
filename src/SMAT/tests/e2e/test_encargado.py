"""Pantallas del encargado: panel con mapa, incidencias, empleados y zonas."""
from conftest import api, esperar_texto, selector, sesion


def token():
    return sesion("maria")["token"]


def test_panel_mapa_abre_el_detalle_de_la_zona(base_limpia, abrir):
    pag = abrir("maria", "/app/panel")
    assert pag.locator('svg g[role="button"]').count() == 4
    pag.locator('svg g[role="button"]', has_text="Zona B").click()
    panel = pag.get_by_role("dialog", name="Zona B")
    activas = api("/incidents?zona_id=2&estado=activa&limit=1", token=token())["total"]
    assert panel.get_by_text(f"Alertas activas ({activas})").is_visible()
    assert panel.get_by_text("Soldadora MIG").is_visible()
    assert panel.get_by_text("Carlos Díaz").first.is_visible()

    # Detener la máquina desde el panel lateral pide confirmación
    panel.get_by_role("button", name="Detener máquina").click()
    panel.get_by_role("button", name="Sí, detener").click()
    pag.wait_for_timeout(900)
    assert panel.get_by_text("Detenida").is_visible()
    zona_b = next(z for z in api("/zones", token=token())["zonas"] if z["id"] == 2)
    assert zona_b["maquina_activa"] is False
    assert not pag.errores


def test_mapa_de_zonas_muestra_las_alertas_activas(base_limpia, abrir):
    """El mapa de Zonas no puede decir "Todo en orden" en una zona con alertas sin resolver."""
    activas = api("/incidents?zona_id=2&estado=activa&limit=1", token=token())["total"]
    assert activas > 0
    pag = abrir("maria", "/app/zonas")
    zona_b = pag.locator('svg g[role="button"]', has_text="Zona B")
    assert zona_b.get_attribute("aria-label") == f"Zona B: {activas} alerta(s) activa(s)"
    assert zona_b.get_by_text("Todo en orden").count() == 0
    assert not pag.errores


def test_sin_conexion_el_robot_no_se_puede_iniciar_y_avisa_que_los_datos_son_viejos(base_limpia, abrir):
    pag = abrir("maria", "/app/robot")                            # sin robot simulado: nunca se conectó
    assert pag.get_by_text("Sin conexión", exact=True).is_visible()
    assert pag.get_by_role("button", name="Iniciar").is_disabled()
    assert pag.get_by_text("tiene que estar encendido y conectado").is_visible()
    assert pag.get_by_role("button", name="PARADA DE EMERGENCIA").is_enabled()
    panel = abrir("maria", "/app/panel")
    assert panel.get_by_text("sin datos", exact=True).first.is_visible()   # no inventa una batería de 100 %
    assert not pag.errores and not panel.errores


def test_en_el_celular_la_parada_de_emergencia_se_ve_sin_bajar(base_limpia, abrir):
    pag = abrir("maria", "/app/robot", ancho=390, alto=800)
    boton = pag.get_by_role("button", name="PARADA DE EMERGENCIA")
    assert boton.is_visible()
    caja = boton.bounding_box()
    menu_inferior = 70
    assert caja["y"] + caja["height"] <= 800 - menu_inferior, caja
    assert pag.evaluate("window.scrollY") == 0
    assert not pag.errores


def test_panel_detalle_de_zona_lleva_a_sus_incidencias(base_limpia, abrir):
    pag = abrir("maria", "/app/panel")
    pag.locator('svg g[role="button"]', has_text="Zona B").click()
    pag.get_by_role("link", name="Ver todas las incidencias de la zona").click()
    pag.wait_for_timeout(1200)
    assert "/app/incidencias" in pag.url and "zona_id=2" in pag.url
    total = api("/incidents?zona_id=2&limit=1", token=token())["total"]
    assert pag.get_by_text(f"{total} en total").is_visible()
    assert selector(pag, "Zona").evaluate("e => e.options[e.selectedIndex].text") == "Zona B"
    assert not pag.errores


def test_incidencias_filtros_y_resolver(base_limpia, abrir):
    pag = abrir("maria", "/app/incidencias")
    selector(pag, "Estado").select_option("activa")
    pag.wait_for_timeout(900)
    antes = api("/incidents?estado=activa&limit=1", token=token())["total"]
    assert pag.get_by_text(f"{antes} en total").is_visible()

    pag.get_by_role("button", name="Ver detalle").first.click()
    pag.get_by_role("button", name="Marcar como resuelta").click()
    pag.wait_for_timeout(1200)
    assert api("/incidents?estado=activa&limit=1", token=token())["total"] == antes - 1
    assert not pag.get_by_role("dialog").is_visible()

    selector(pag, "Estado").select_option("resuelta")
    pag.wait_for_timeout(900)
    pag.get_by_role("button", name="Ver detalle").first.click()
    assert pag.get_by_text("Resuelta por").is_visible()


def test_resolver_varias_alertas_a_la_vez(base_limpia, abrir):
    activas_antes = api("/incidents?estado=activa&limit=1", token=token())["total"]
    assert activas_antes >= 3
    pag = abrir("maria", "/app/incidencias")

    marcas = pag.get_by_role("checkbox", name="Marcar la alerta")
    assert marcas.count() >= 3                                    # solo las activas se pueden marcar
    marcas.nth(0).check()
    marcas.nth(1).check()
    assert pag.get_by_text("2 alertas marcadas").is_visible()

    # Cancelar la confirmación no resuelve nada
    pag.get_by_role("button", name="Resolver 2 alertas").click()
    ventana = pag.get_by_role("dialog", name="Resolver 2 alertas")
    assert ventana.get_by_text("no se reactivan").is_visible()
    ventana.get_by_role("button", name="Cancelar").click()
    assert api("/incidents?estado=activa&limit=1", token=token())["total"] == activas_antes

    pag.get_by_role("button", name="Resolver 2 alertas").click()
    pag.get_by_role("dialog", name="Resolver 2 alertas").get_by_role("button", name="Sí, resolver").click()
    assert esperar_texto(pag, "2 alertas marcadas como resueltas", 4)
    assert api("/incidents?estado=activa&limit=1", token=token())["total"] == activas_antes - 2
    assert pag.get_by_role("button", name="Desmarcar").count() == 0

    # "Marcar todas" toma solo las activas de la página, y un filtro nuevo desmarca
    pag.get_by_role("checkbox", name="Marcar todas las activas").check()
    assert pag.get_by_role("button", name="Desmarcar").is_visible()
    selector(pag, "Zona").select_option(label="Zona A")
    pag.wait_for_timeout(500)
    assert pag.get_by_role("button", name="Desmarcar").count() == 0
    assert not pag.errores


def test_el_panel_muestra_hace_cuanto_esta_la_alerta_mas_vieja(base_limpia, abrir):
    pag = abrir("maria", "/app/panel")
    assert pag.get_by_text("Sin resolver · la más vieja, hace", exact=False).is_visible()
    assert not pag.errores


def test_incidencias_en_celular_usa_tarjetas(abrir):
    pag = abrir("maria", "/app/incidencias", ancho=390, alto=844)
    assert pag.locator("article").count() > 0 and not pag.locator("table").first.is_visible()
    assert pag.evaluate("document.documentElement.scrollWidth") <= 390


def test_empleados_alta_edicion_baja_y_reactivacion(base_limpia, abrir):
    pag = abrir("maria", "/app/empleados")
    pag.get_by_role("button", name="+ Nuevo empleado").click()
    pag.get_by_label("Nombre completo").fill("Prueba Tester")
    pag.get_by_label("Usuario").fill("tester1")
    pag.get_by_label("Contraseña").fill("clave123")
    selector(pag, "Zona", en_ventana=True).select_option(label="Zona C")
    pag.get_by_role("button", name="Crear empleado").click()
    assert esperar_texto(pag, "Empleado creado")      # guardar la contraseña (hash) tarda un poco a propósito
    usuarios = lambda: {u["usuario"]: u for u in api("/users", token=token())["usuarios"]}  # noqa: E731
    assert usuarios()["tester1"]["zona"] == "Zona C"

    # usuario repetido: el error del servidor se ve y la ventana no se cierra
    pag.get_by_role("button", name="+ Nuevo empleado").click()
    pag.get_by_label("Nombre completo").fill("Otro"); pag.get_by_label("Usuario").fill("tester1"); pag.get_by_label("Contraseña").fill("clave123")
    pag.get_by_role("button", name="Crear empleado").click()
    pag.wait_for_timeout(800)
    assert pag.get_by_text("Ya existe un usuario").is_visible() and pag.get_by_role("dialog").is_visible()
    pag.get_by_role("button", name="Cancelar").click()

    pag.get_by_label("Buscar").fill("tester")
    pag.get_by_role("button", name="Editar").first.click()
    selector(pag, "Zona", en_ventana=True).select_option(label="Zona D")
    pag.get_by_role("button", name="Guardar cambios").click()
    pag.wait_for_timeout(900)
    assert usuarios()["tester1"]["zona"] == "Zona D"

    pag.get_by_role("button", name="Dar de baja").first.click()
    pag.get_by_role("button", name="Sí, dar de baja").click()
    pag.wait_for_timeout(900)
    assert usuarios()["tester1"]["activo"] is False
    selector(pag, "Estado").select_option("false")
    pag.get_by_role("button", name="Reactivar").first.click()
    pag.wait_for_timeout(900)
    assert usuarios()["tester1"]["activo"] is True
    assert not pag.errores


def test_zonas_superposicion_alta_y_borrado(base_limpia, abrir):
    pag = abrir("maria", "/app/zonas")
    assert pag.locator("article").count() == 4
    pag.get_by_role("button", name="+ Nueva zona").click()
    pag.get_by_label("Nombre de la zona").fill("Zona E")
    pag.get_by_label("Máquina", exact=True).fill("Torno CNC")
    assert pag.get_by_text("se superpone con").is_visible() and pag.get_by_role("button", name="Crear zona").is_disabled()
    pag.get_by_label("Columna").fill("6")
    assert pag.get_by_role("button", name="Crear zona").is_enabled()
    pag.get_by_role("dialog").get_by_text("Casco", exact=True).click()
    pag.get_by_role("button", name="Crear zona").click()
    pag.wait_for_timeout(1000)
    zonas = {z["nombre"]: z for z in api("/zones", token=token())["zonas"]}
    assert zonas["Zona E"]["grilla_x"] == 6 and zonas["Zona E"]["epp_requerido"] == ["casco"]

    pag.locator("article", has_text="Zona A").get_by_role("button", name="Borrar").click()
    pag.get_by_role("button", name="Sí, borrar").click()
    pag.wait_for_timeout(800)
    assert pag.get_by_text("No se puede borrar").is_visible()        # tiene alertas
    pag.get_by_role("button", name="Cancelar").click()
    pag.locator("article", has_text="Zona E").get_by_role("button", name="Borrar").click()
    pag.get_by_role("button", name="Sí, borrar").click()
    pag.wait_for_timeout(900)
    assert "Zona E" not in {z["nombre"] for z in api("/zones", token=token())["zonas"]}
    assert not pag.errores
