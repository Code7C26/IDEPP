"""La web en inglés: con el botón EN tiene que quedar TODO en inglés, no solo una parte (utils/traductorPagina.js).
Recorre las páginas públicas y las de cada rol, junta los textos que se ven y falla si alguno sigue en español."""
import re

import pytest

from conftest import esperar_texto

# Todo el texto de la página: nodos de texto y lo que leen los lectores de pantalla
TEXTOS = """() => {
  const out = new Set()
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const p = n.parentElement
    if (!p || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(p.tagName) || !p.getClientRects().length) continue
    const s = n.nodeValue.trim()
    if (s) out.add(s)
  }
  document.querySelectorAll('[placeholder],[aria-label],[title]').forEach((e) => {
    for (const a of ['placeholder', 'aria-label', 'title']) { const v = e.getAttribute(a); if (v && v.trim()) out.add(v.trim()) }
  })
  out.add(document.title)
  return [...out]
}"""

# Palabras y letras que en inglés no aparecen. Van en minúscula: «ES» del botón de idioma o «Sin» no cuentan
ESPANOL = re.compile(r"[áéíóúñ¿¡]|\b(de|del|la|las|los|el|que|con|por|para|sin|una|está|hay|tu|su|zona|zonas|alerta|alertas|hace)\b")
# Datos de ejemplo que son nombres propios: no se traducen
NOMBRES = ("Juan Pérez", "María Encargada", "Lucía Gómez", "Carlos Díaz", "Ana Martínez", "Pedro Sosa", "Sofía Romero",
           "Morena Boeris", "Tiziano Tomás Donato", "Córdoba", "Español")

PAGINAS = [
    (None, "/"), (None, "/como-funciona"), (None, "/juego"), (None, "/planes"), (None, "/nosotros"), (None, "/contacto"),
    (None, "/login"),
    ("maria", "/app/panel"), ("maria", "/app/incidencias"), ("maria", "/app/robot"), ("maria", "/app/zonas"),
    ("maria", "/app/empleados"), ("maria", "/app/reportes"), ("maria", "/app/auditoria"),
    ("juan", "/app"), ("juan", "/app/mis-alertas"), ("juan", "/app/perfil"),
]


def en_ingles(pag):
    pag.evaluate("localStorage.setItem('idioma', 'en')")
    pag.reload()
    pag.wait_for_load_state("networkidle")
    pag.wait_for_timeout(1500)


def en_espanol(textos):
    sin_nombres = []
    for s in textos:
        limpio = s
        for nombre in NOMBRES:
            limpio = limpio.replace(nombre, "")
        if ESPANOL.search(limpio):
            sin_nombres.append(s)
    return sin_nombres


@pytest.mark.parametrize("usuario,ruta", PAGINAS, ids=[f"{u or 'publico'}{r.replace('/', '_')}" for u, r in PAGINAS])
def test_en_ingles_no_queda_nada_en_espanol(base_limpia, abrir, usuario, ruta):
    pag = abrir(usuario, ruta)
    en_ingles(pag)
    quedan = en_espanol(pag.evaluate(TEXTOS))
    assert not quedan, f"{ruta} sigue en español: {quedan[:8]}"
    assert not pag.errores


def test_los_avisos_y_las_ventanas_tambien_salen_en_ingles(base_limpia, abrir):
    pag = abrir("maria", "/app/zonas")
    en_ingles(pag)
    pag.get_by_role("button", name="+ New area").click()
    pag.wait_for_timeout(600)
    assert pag.get_by_role("dialog").get_by_text("Area name").is_visible()
    assert not en_espanol(pag.evaluate(TEXTOS))
    # Un error del servidor también llega traducido
    login = abrir(None, "/login")
    en_ingles(login)
    login.get_by_label("Username").fill("maria")
    login.get_by_label("Password").fill("una-clave-mala")
    login.get_by_role("button", name="Log in").click()
    assert esperar_texto(login, "Wrong username or password", exacto=False)


def test_al_volver_al_espanol_todo_vuelve_a_estar_en_espanol(base_limpia, abrir):
    pag = abrir(None, "/planes")
    en_ingles(pag)
    assert pag.get_by_text("Purchase Plan").first.is_visible()
    pag.get_by_role("button", name="Change language to Spanish").first.click()
    pag.wait_for_timeout(800)
    assert pag.get_by_text("Plan Compra").first.is_visible()
    assert not pag.get_by_text("Purchase Plan").first.is_visible()


def test_resolver_alertas_en_ingles(base_limpia, abrir):
    """Marcar varias alertas, la ventana de confirmación y el detalle de una alerta, todo en inglés."""
    pag = abrir("maria", "/app/incidencias")
    en_ingles(pag)
    pag.locator("table tbody input[type=checkbox]").first.check()
    pag.get_by_role("button", name=re.compile(r"^Resolve \d+ alerts?$")).click()
    pag.wait_for_timeout(600)
    dialogo = pag.get_by_role("dialog")
    assert dialogo.get_by_text(re.compile("is marked as resolved|are marked as resolved")).is_visible()
    assert not en_espanol(pag.evaluate(TEXTOS))
    dialogo.get_by_role("button", name="Cancel").click()
    pag.get_by_role("button", name=re.compile("^See details")).first.click()
    pag.wait_for_timeout(600)
    assert pag.get_by_role("dialog").get_by_text("Alert details").is_visible()
    assert not en_espanol(pag.evaluate(TEXTOS))
