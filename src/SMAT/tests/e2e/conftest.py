"""Herramientas comunes de las pruebas de punta a punta (Playwright).

No se corren solas: usá  python tests/correr_e2e.py  (levanta los servidores de prueba).
"""
import importlib.util
import json
import os
import re
import urllib.request

import pytest
from playwright.sync_api import sync_playwright

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _cargar_base_datos():
    """Carga backend/tests/base_datos.py por su ruta (hay dos carpetas 'tests' y no deben confundirse)."""
    ruta = os.path.join(APP, "backend", "tests", "base_datos.py")
    spec = importlib.util.spec_from_file_location("base_datos_prueba", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo.recrear_base


recrear_base = _cargar_base_datos()

WEB = os.getenv("WEB_URL", "http://localhost:5174")
API = os.getenv("API_URL", "http://127.0.0.1:5001/api")
YOLO = {"X-API-KEY": os.getenv("YOLO_API_KEY", "clave-yolo-e2e")}
ROBOT = {"X-API-KEY": os.getenv("ROBOT_API_KEY", "clave-robot-e2e")}
CAPTURAS = os.path.join(os.path.dirname(__file__), "capturas")


def api(ruta, token=None, cabeceras=None, datos=None, metodo=None):
    """Llama al backend de prueba y devuelve el JSON."""
    h = {"Content-Type": "application/json", **(cabeceras or {})}
    if token:
        h["Authorization"] = f"Bearer {token}"
    pedido = urllib.request.Request(API + ruta, headers=h, data=json.dumps(datos).encode() if datos is not None else None,
                                    method=metodo or ("POST" if datos is not None else "GET"))
    return json.loads(urllib.request.urlopen(pedido).read())


_sesiones = {}


def sesion(usuario):
    """Datos de login (con token) de un usuario de prueba. Se guarda para no loguearse cada vez."""
    if usuario not in _sesiones:
        _sesiones[usuario] = api("/login", datos={"usuario": usuario, "contrasena": "pass123"})
    return _sesiones[usuario]


def selector(pagina, etiqueta, en_ventana=False):
    """El <select> de una etiqueta.
    - En los filtros el select está ADENTRO de la etiqueta (su nombre accesible incluye las opciones).
    - En los formularios (ventanas y paneles) la etiqueta lo apunta con htmlFor."""
    if en_ventana:
        return pagina.get_by_role("dialog").get_by_label(etiqueta, exact=True)
    return pagina.locator("label", has_text=re.compile(f"^{etiqueta}")).locator("select").first


def esperar_texto(pagina, texto, segundos=9, exacto=True):
    for _ in range(int(segundos * 4)):
        if pagina.get_by_text(texto, exact=exacto).first.is_visible():
            return True
        pagina.wait_for_timeout(250)
    return False


def pytest_sessionstart(session):
    try:
        urllib.request.urlopen(f"{API}/health", timeout=3)
        urllib.request.urlopen(WEB, timeout=3)
    except Exception as e:
        pytest.exit(f"Los servidores de prueba no están andando ({e}). Corré:  python tests/correr_e2e.py", returncode=2)


@pytest.fixture(scope="session")
def playwright_sesion():
    """Una sola por corrida: Playwright no permite abrir dos a la vez."""
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def navegador(playwright_sesion):
    # channel="chromium" usa el navegador completo sin ventana. Sin channel, Playwright usa una versión
    # recortada ("headless shell") que no tiene notificaciones y hace fallar las pruebas de la Fase 7.
    nav = playwright_sesion.chromium.launch(channel=os.getenv("NAVEGADOR", "chromium"), headless=True)
    yield nav
    nav.close()


@pytest.fixture(scope="session")
def navegador_3d(playwright_sesion):
    """Con WebGL por software, para probar los renders y el juego. Va aparte porque es más lento."""
    nav = playwright_sesion.chromium.launch(channel=os.getenv("NAVEGADOR", "chromium"), headless=True,
                                            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    yield nav
    nav.close()


@pytest.fixture
def base_limpia():
    """Vuelve la base de prueba a los datos de ejemplo."""
    recrear_base(os.getenv("E2E_DB", "robot_db_e2e"))


def _abridor(navegador, request, capturar=True):
    """Generador con la función abrir(usuario, ruta): al final de la prueba guarda una captura y cierra todo."""
    contextos = []

    def _abrir(usuario, ruta, ancho=1280, alto=900, tema="claro"):
        celular = ancho < 700
        ctx = navegador.new_context(viewport={"width": ancho, "height": alto}, is_mobile=celular, has_touch=celular, locale="es-AR")
        guardar_sesion = (f"localStorage.setItem('user', {json.dumps(json.dumps(sesion(usuario)))});"
                          if usuario else "localStorage.removeItem('user');")
        ctx.add_init_script(f"localStorage.setItem('tema', '{tema}');" + guardar_sesion)
        pagina = ctx.new_page()
        pagina.errores = []
        pagina.on("pageerror", lambda e: pagina.errores.append(str(e)))
        pagina.on("response", lambda r: pagina.errores.append(f"{r.status} {r.url}")
                  if r.status >= 500 or (r.status == 404 and "favicon" not in r.url) else None)
        pagina.goto(WEB + ruta)
        pagina.wait_for_load_state("networkidle")
        pagina.wait_for_timeout(800)
        contextos.append((ctx, pagina))
        return pagina

    yield _abrir
    os.makedirs(CAPTURAS, exist_ok=True)
    for i, (ctx, pagina) in enumerate(contextos):
        try:
            if capturar:
                pagina.screenshot(path=os.path.join(CAPTURAS, f"{request.node.name}-{i}.png"), full_page=True)
        finally:
            ctx.close()


@pytest.fixture
def abrir(navegador, request):
    """abrir(usuario, ruta) -> página ya logueada (usuario=None: sin sesión). Al final de la prueba guarda una captura."""
    yield from _abridor(navegador, request)


@pytest.fixture
def abrir_3d(navegador_3d, request):
    """Igual que abrir, en el navegador con WebGL. Sin placa de video el 3D frena toda la página: en estas
    pruebas conviene una ventana chica, y hay que bajar hasta el render con centrar_render."""
    yield from _abridor(navegador_3d, request, capturar=False)


def centrar_render(pagina):
    """Lleva el render a la pantalla. No usa scroll_into_view_if_needed: espera que la página esté quieta, y
    con el 3D corriendo por software puede no llegar a estarlo."""
    pagina.evaluate("document.querySelector('iframe').scrollIntoView({ block: 'center' })")
