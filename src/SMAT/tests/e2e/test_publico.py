"""Página pública de DROID-E3D (sin login): secciones, menú del celular, contacto y acceso a la app."""
from urllib.parse import unquote

from conftest import centrar_render, solo_con_video

# Reemplaza window.open para ver qué enlace se abriría (mail o WhatsApp) sin salir de la página
ESPIAR_ABRIR = "window.__abierto = null; window.open = (url) => { window.__abierto = url }"


def test_inicio_y_secciones(base_limpia, abrir):
    pag = abrir(None, "/")
    assert pag.get_by_role("heading", level=1).inner_text().startswith("Seguridad que")
    assert pag.title().startswith("DROID-E3D by IDEPP")
    assert pag.get_by_role("img", name="Panel del encargado").first.is_visible()      # captura real de la app
    for seccion, titulo in (("Cómo funciona", "Un robot, una IA"), ("Planes", "Lo que cuestan dos meses"),
                            ("Nosotros", "Que cada trabajador"), ("Contacto", "Pedí una demo")):
        pag.get_by_role("navigation", name="Principal").get_by_role("link", name=seccion).click()
        pag.wait_for_timeout(400)
        assert pag.get_by_role("heading", level=1).inner_text().startswith(titulo)
        assert pag.title().startswith(seccion)
    assert pag.get_by_text("$1.400.000").count() == 0                # (estamos en Contacto)
    pag.goto(pag.url.replace("/contacto", "/planes"))
    assert pag.get_by_text("$1.400.000").is_visible() and pag.get_by_text("+ $75.000 por mes").is_visible()
    assert not pag.errores


def test_menu_del_celular(base_limpia, abrir):
    pag = abrir(None, "/", ancho=390, alto=800, tema="oscuro")
    encabezado = pag.get_by_role("banner")
    assert not encabezado.get_by_role("link", name="Planes").first.is_visible()      # escondido hasta abrir el menú
    pag.get_by_role("button", name="Abrir menú").click()
    pag.locator("#menu-publico").get_by_role("link", name="Planes").click()
    pag.wait_for_timeout(400)
    assert "/planes" in pag.url and not pag.locator("#menu-publico").is_visible()   # se cierra solo
    assert pag.evaluate("document.documentElement.scrollWidth") <= 390
    assert not pag.errores


def test_contacto_valida_y_arma_el_mensaje(base_limpia, abrir):
    pag = abrir(None, "/contacto")
    pag.evaluate(ESPIAR_ABRIR)
    pag.get_by_role("button", name="Enviar por WhatsApp").click()
    assert pag.get_by_text("Escribí tu nombre.").is_visible()
    assert pag.evaluate("window.__abierto") is None                 # con errores no abre nada

    pag.get_by_label("Nombre").fill("Ana Prueba")
    pag.get_by_label("Empresa").fill("Metalúrgica Sur")
    pag.get_by_role("button", name="Enviar por WhatsApp").click()
    enlace = unquote(pag.evaluate("window.__abierto"))
    assert enlace.startswith("https://wa.me/5491100000000?text=")
    assert "Hola, soy Ana Prueba de Metalúrgica Sur." in enlace

    pag.get_by_role("button", name="Enviar por mail").click()
    enlace = unquote(pag.evaluate("window.__abierto"))
    assert enlace.startswith("mailto:demo@ejemplo.com?subject=Consulta por DROID-E3D · Metalúrgica Sur")
    assert not pag.errores


def test_ingresar_lleva_al_login_o_a_la_app(base_limpia, abrir):
    pag = abrir(None, "/")
    pag.get_by_role("banner").get_by_role("link", name="Ingresar", exact=True).click()
    pag.wait_for_timeout(500)
    assert pag.url.endswith("/login")
    pag.get_by_role("link", name="Conocé DROID-E3D").click()
    pag.wait_for_timeout(500)
    assert pag.get_by_role("heading", level=1).inner_text().startswith("Seguridad que")

    con_sesion = abrir("maria", "/")
    con_sesion.get_by_role("banner").get_by_role("link", name="Ir a la app").click()
    con_sesion.wait_for_timeout(800)
    assert con_sesion.url.endswith("/app/panel")


def test_las_paginas_publicas_llevan_cada_render_en_su_lugar(base_limpia, abrir):
    for ruta, archivo in (("/", "fabrica"), ("/como-funciona", "robot"), ("/juego", "patrulla")):
        pag = abrir(None, ruta)
        # Sin WebGL (GitHub Actions) la página avisa en vez de cargar el archivo
        marcos = pag.locator("iframe")
        assert marcos.count() == 1 and f"/robot3d/{archivo}.html" in marcos.get_attribute("src") or pag.get_by_text("no puede mostrar el modelo 3D").is_visible()
        assert not pag.errores


@solo_con_video
def test_los_renders_se_ven_dentro_de_las_paginas(base_limpia, abrir_3d):
    casos = (("/", "Registro de incidencias", "Seguir al robot"), ("/como-funciona", "Chasis DROID-E3D", "Vista de frente"))
    for ruta, texto, boton in casos:
        pag = abrir_3d(None, ruta, ancho=640, alto=700)
        pedidos = []
        pag.on("request", lambda r: pedidos.append(r.url))
        pag.reload()
        centrar_render(pag)
        marco = pag.frame_locator("iframe").first
        marco.locator("canvas").wait_for(timeout=10000)
        marco.get_by_text(texto).first.wait_for(timeout=5000)
        assert marco.get_by_role("button", name=boton).is_visible()
        assert not pag.errores
        # Nada de internet: el día de la demo tiene que andar sin conexión
        afuera = [p for p in pedidos if not p.startswith(("http://localhost", "http://127.0.0.1", "data:", "blob:"))]
        assert not afuera, afuera
        # El iframe se ajusta a su contenido: no queda con barra de scroll propia
        assert pag.locator("iframe").first.evaluate(
            "m => m.contentDocument.documentElement.scrollHeight <= m.clientHeight + 2")


def _entrar_al_juego(pag, nombre):
    """El juego pide el nombre la primera vez: con él guarda los puntajes en el ranking."""
    juego = pag.frame_locator("iframe")
    juego.get_by_label("¿Cómo te llamás?").fill(nombre)
    juego.get_by_role("button", name="ENTRAR").click()
    return juego


def test_se_puede_jugar_a_patrulla(base_limpia, abrir_3d):
    pag = abrir_3d(None, "/juego", ancho=640, alto=700)
    juego = _entrar_al_juego(pag, "Ana")
    assert juego.locator("#nombreJugador").inner_text() == "Ana"
    juego.get_by_role("button", name="JUGAR", exact=True).click()
    assert juego.locator("#hud").is_visible()
    assert not juego.locator("#menu").is_visible()
    assert not pag.errores


def test_el_juego_guarda_los_puntajes_en_el_ranking(base_limpia, abrir_3d):
    pag = abrir_3d(None, "/juego", ancho=640, alto=700)
    juego = _entrar_al_juego(pag, "Ana")
    juego.get_by_role("button", name="JUGAR", exact=True).click()
    marco = next(f for f in pag.frames if "patrulla" in f.url)
    marco.evaluate("window.__game.game.score = 900; window.__game.end('time')")
    assert juego.get_by_text("¡Primer puesto en Turno clásico · Normal!").is_visible()
    juego.get_by_role("button", name="VER RANKING").click()
    fila = juego.locator("#tablaRanking tbody tr").first
    assert "Ana" in fila.inner_text() and "900" in fila.inner_text()

    # Queda guardado en el navegador: al volver, recuerda al jugador y su ranking
    pag.reload()
    juego.locator("#menu").wait_for(timeout=15000)
    assert juego.locator("#nombreJugador").inner_text() == "Ana"
    juego.get_by_role("tab", name="RANKING").click()
    assert "900" in juego.locator("#tablaRanking tbody tr").first.inner_text()
    assert not pag.errores


def test_la_web_describe_el_robot_actual_y_lo_que_detecta_hoy(abrir):
    """El robot tiene orugas y no corta máquinas (PR #149 y #153), y la IA detecta casco, guantes, lentes y chaleco."""
    for ruta in ("/", "/como-funciona", "/nosotros"):
        contenido = abrir(None, ruta).locator("body").inner_text().lower()
        assert "ruedas" not in contenido and "detiene la máquina" not in contenido, ruta
        assert "próximo: guantes" not in contenido, ruta
    assert abrir(None, "/").get_by_text("Detecta casco, guantes, lentes y chaleco").is_visible()


def test_la_web_cambia_a_ingles_y_lo_recuerda(base_limpia, abrir):
    """Etapa 5: sección bilingüe. El botón ES · EN cambia los textos clave y la elección queda guardada."""
    pag = abrir(None, "/")
    pag.get_by_role("button", name="Cambiar idioma a inglés").first.click()
    assert pag.get_by_role("heading", level=1).inner_text().startswith("Safety that")
    assert pag.get_by_role("link", name="Request a demo").first.is_visible()
    assert pag.evaluate("document.documentElement.lang") == "en"
    pag.reload()
    assert pag.get_by_role("heading", level=1).inner_text().startswith("Safety that")      # quedó guardado
    pag.goto(pag.url.rstrip("/") + "/login")
    assert pag.get_by_role("heading", name="Log in to DROID-E3D").is_visible()
    pag.get_by_role("button", name="Change language to Spanish").first.click()
    assert pag.get_by_role("heading", name="Ingresá a DROID-E3D").is_visible()
    assert not pag.errores


def test_la_guia_interactiva_recorre_la_pagina(base_limpia, abrir):
    """Etapa 5: versión interactiva (como Intro.js). El botón "?" abre la guía de la página y se recorre paso a paso."""
    pag = abrir(None, "/")
    pag.get_by_role("button", name="Abrir la guía").first.click()
    guia = pag.get_by_role("dialog")
    assert guia.get_by_text("Paso 1 de 5").is_visible()
    for _ in range(4):
        guia.get_by_role("button", name="Siguiente").click()
    assert guia.get_by_text("Paso 5 de 5").is_visible()
    guia.get_by_role("button", name="Terminar").click()
    assert pag.get_by_role("dialog").count() == 0
    assert not pag.errores


def test_el_asistente_responde_las_preguntas_frecuentes(base_limpia, abrir):
    """Etapa 5: chatbot de preguntas frecuentes. Responde lo que se toca y lo que se escribe, en los dos idiomas."""
    pag = abrir(None, "/", ancho=390, alto=800)
    pag.get_by_role("button", name="Abrir las preguntas frecuentes").click()
    asistente = pag.get_by_role("dialog", name="Preguntas frecuentes")
    asistente.get_by_role("button", name="¿Cuánto cuesta?").click()
    assert asistente.get_by_text("$1.400.000", exact=False).is_visible()
    asistente.get_by_label("Escribí tu pregunta").fill("qué pasa con las fotos de mi cara")
    asistente.get_by_role("button", name="Enviar").click()
    assert asistente.get_by_text("consentimiento del empleado", exact=False).is_visible()
    asistente.get_by_label("Escribí tu pregunta").fill("xyz")
    asistente.get_by_role("button", name="Enviar").click()
    assert asistente.get_by_text("No tengo esa respuesta", exact=False).is_visible()
    asistente.get_by_role("link", name="Ir a Contacto").last.click()
    assert pag.url.endswith("/contacto") and pag.get_by_role("dialog").count() == 0
    assert not pag.errores
    # En el juego no está: en el celular taparía los botones para manejar el robot
    assert abrir(None, "/juego", ancho=390, alto=800).get_by_role("button", name="Abrir las preguntas frecuentes").count() == 0
