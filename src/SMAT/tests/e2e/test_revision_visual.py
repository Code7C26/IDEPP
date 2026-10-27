"""Tarea 9.1: revisión de TODAS las pantallas en celular (360 px) y PC, en modo claro y oscuro.

Por cada pantalla revisa que:
- no haya errores de la página ni respuestas 404/500,
- no aparezca scroll de costado (en el celular es lo que más se rompe),
- no quede trabado un «Cargando…»,
- el modo oscuro se aplique de verdad.
Al final de cada caso queda una captura en tests/e2e/capturas/ (la guarda el fixture «abrir»).
"""
import pytest

from conftest import API

# (usuario que entra, ruta). None = sin sesión
PANTALLAS = [
    (None, "/"),
    (None, "/como-funciona"),
    (None, "/planes"),
    (None, "/nosotros"),
    (None, "/contacto"),
    (None, "/login"),
    (None, "/no-existe"),
    ("juan", "/app"),
    ("juan", "/app/mis-alertas"),
    ("juan", "/app/perfil"),
    ("maria", "/app/panel"),
    ("maria", "/app/incidencias"),
    ("maria", "/app/empleados"),
    ("maria", "/app/zonas"),
    ("maria", "/app/robot"),
    ("maria", "/app/reportes"),
    ("maria", "/app/auditoria"),
]

# nombre: (ancho, alto)
TAMANOS = {"celular": (360, 740), "pc": (1366, 768)}


def _nombre(pantalla):
    usuario, ruta = pantalla
    return f"{usuario or 'publico'}{ruta.replace('/', '_')}"


@pytest.mark.parametrize("tema", ["claro", "oscuro"])
@pytest.mark.parametrize("tamano", list(TAMANOS))
@pytest.mark.parametrize("pantalla", PANTALLAS, ids=_nombre)
def test_pantalla_se_ve_bien(abrir, pantalla, tamano, tema):
    usuario, ruta = pantalla
    ancho, alto = TAMANOS[tamano]
    pag = abrir(usuario, ruta, ancho=ancho, alto=alto, tema=tema)

    assert not pag.errores, f"errores en {ruta}: {pag.errores}"

    # Scroll de costado: el contenido no puede ser más ancho que la ventana (1 px de tolerancia)
    sobrante = pag.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert sobrante <= 1, f"{ruta} tiene {sobrante} px de scroll de costado en {tamano}"

    # Ningún «Cargando…» trabado (esperamos un poco por si la página es lenta)
    for _ in range(20):
        if not pag.get_by_text("Cargando…").first.is_visible():
            break
        pag.wait_for_timeout(250)
    else:
        pytest.fail(f"{ruta} quedó en «Cargando…»")

    oscuro = pag.evaluate("document.documentElement.classList.contains('dark')")
    assert oscuro == (tema == "oscuro"), f"{ruta}: el tema {tema} no se aplicó"

    # Bajamos hasta el final para que carguen las imágenes "lazy" (y salgan en la captura)
    pag.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    pag.wait_for_timeout(800)
    pag.evaluate("window.scrollTo(0, 0)")
    # Imágenes rotas: terminaron de cargar pero no tienen tamaño (archivo que no existe o dañado)
    rotas = pag.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src)")
    assert not rotas, f"{ruta} tiene imágenes rotas: {rotas}"


@pytest.mark.parametrize("pantalla", [p for p in PANTALLAS if p[0]], ids=_nombre)
def test_sin_servidor_avisa_el_error(abrir, pantalla):
    """Si el backend se cae, la pantalla avisa en vez de quedar en blanco o cargando para siempre."""
    usuario, ruta = pantalla
    pag = abrir(usuario, ruta, ancho=360, alto=740)
    # Desde acá ninguna llamada al backend responde (solo la API: la web en sí se sigue cargando)
    pag.route(f"{API}/**", lambda r: r.abort())
    pag.reload()
    pag.wait_for_timeout(1500)

    for _ in range(20):
        if pag.get_by_text("No se pudo conectar con el servidor").first.is_visible():
            break
        pag.wait_for_timeout(250)
    else:
        pytest.fail(f"{ruta} no avisa que no hay conexión con el servidor")
    assert not pag.get_by_text("Cargando…").first.is_visible(), f"{ruta} quedó en «Cargando…»"
