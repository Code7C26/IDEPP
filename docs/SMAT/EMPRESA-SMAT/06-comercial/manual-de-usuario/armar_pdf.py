"""Arma los PDF del librito (A5) y capturas de cada página para revisarlo."""
import os
import sys
from playwright.sync_api import sync_playwright

CARPETA = sys.argv[1]
SALIDA = sys.argv[2]
HTML = "file:///" + os.path.join(CARPETA, "manual.html").replace("\\", "/")
os.makedirs(SALIDA, exist_ok=True)

with sync_playwright() as p:
    nav = p.chromium.launch(channel="msedge")
    pag = nav.new_page(viewport={"width": 700, "height": 1000}, device_scale_factor=1.5)
    pag.goto(HTML, wait_until="networkidle")
    pag.evaluate("document.fonts.ready")
    pag.emulate_media(media="print")
    # Versión para ver y para la imprenta común: A5 justo
    pag.pdf(path=os.path.join(SALIDA, "Manual de usuario DROID-E3D (A5).pdf"),
            width="148mm", height="210mm", print_background=True, margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    # Capturas para revisar
    paginas = pag.query_selector_all(".pagina")
    for i, el in enumerate(paginas, 1):
        el.screenshot(path=os.path.join(SALIDA, f"pag{i:02d}.png"))
    # Versión con 3 mm de sangrado (por si la imprenta la pide)
    pag.evaluate("document.documentElement.style.setProperty('--b', '3mm')")
    pag.pdf(path=os.path.join(SALIDA, "Manual de usuario DROID-E3D (A5 con sangrado 3 mm).pdf"),
            width="154mm", height="216mm", print_background=True, margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    print("páginas:", len(paginas))
    nav.close()
