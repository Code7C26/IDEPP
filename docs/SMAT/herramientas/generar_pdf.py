"""Genera los PDF de las entregas de SMAT (con carátula) y la imagen del Business Model Canvas.

- Cada entrega se escribe en Markdown (se lee directo en GitHub) y este script arma su PDF,
  listo para subir a Classroom, en la carpeta pdf/ al lado del .md.
- El Markdown se convierte con la API de GitHub (`gh api markdown`), así no hace falta instalar nada más.
- El Canvas (canvas/business-model-canvas.html) se exporta a PNG y PDF.

Uso, desde la raíz del repo (con `gh` logueado y el venv del backend, que trae Playwright):
    src\\SMAT\\backend\\venv\\Scripts\\python.exe docs\\SMAT\\herramientas\\generar_pdf.py
    ... generar_pdf.py docs\\SMAT\\documentacion-comercial\\05-los-primeros-10.md   (solo una)
"""
import html
import os
import re
import subprocess
import sys
from datetime import date

from playwright.sync_api import sync_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
COMERCIAL = os.path.join(RAIZ, "docs", "SMAT", "documentacion-comercial")
LOGO = os.path.join(RAIZ, "docs", "SMAT", "EMPRESA-SMAT", "03-marca", "logo", "droid-e3d-icono.svg")
NAVEGADOR = "msedge" if os.name == "nt" else "chromium"

ESTILO = """
@page { size: A4; margin: 18mm 16mm 20mm; }
body { font-family: "Segoe UI", system-ui, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1f2328; }
h1 { font-size: 20pt; margin: 0 0 6pt; } h2 { font-size: 14pt; margin: 18pt 0 6pt; border-bottom: 2px solid #f5b800; padding-bottom: 3pt; }
h3 { font-size: 11.5pt; margin: 12pt 0 4pt; } p, li { margin: 4pt 0; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 9pt; page-break-inside: auto; }
tr { page-break-inside: avoid; } th, td { border: 1px solid #c9ccd1; padding: 4pt 5pt; vertical-align: top; text-align: left; }
th { background: #f3f4f6; } blockquote { margin: 6pt 0; padding: 6pt 10pt; background: #fff8dc; border-left: 4px solid #f5b800; }
code { font-family: Consolas, monospace; font-size: 8.5pt; background: #f3f4f6; padding: 0 2pt; border-radius: 2pt; }
a { color: #1f5fbf; text-decoration: none; } hr { border: 0; border-top: 1px solid #ddd; margin: 12pt 0; }
img { max-width: 100%; }
.caratula { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
.franja { height: 10px; background: repeating-linear-gradient(45deg, #f5b800 0 14px, #1f2328 14px 28px); }
.caratula h1 { font-size: 30pt; line-height: 1.15; margin-top: 30mm; }
.caratula .materia { font-size: 13pt; color: #555; margin-top: 8pt; }
.caratula dl { display: grid; grid-template-columns: 38mm 1fr; gap: 4pt 8pt; font-size: 11pt; }
.caratula dt { font-weight: 600; color: #555; }
.marca { display: flex; align-items: center; gap: 10pt; font-size: 16pt; font-weight: 800; }
.marca small { display: block; font-size: 10pt; font-weight: 500; color: #666; }
"""


def markdown_a_html(ruta):
    """Convierte el Markdown con la API de GitHub (mismo formato que se ve en el repo)."""
    salida = subprocess.run(["gh", "api", "markdown", "-f", "mode=markdown", "-F", f"text=@{ruta}"],
                            capture_output=True, text=True, encoding="utf-8", check=True)
    return salida.stdout


def datos_de_portada(texto):
    """Toma el título (primer # ) y la materia de la línea «Materia:» del Markdown."""
    titulo = re.search(r"^# (.+)$", texto, re.M).group(1).strip()
    materia = re.search(r"\*\*Materia:\*\* ([^·\n]+)", texto)
    return titulo, (materia.group(1).strip() if materia else "")


def armar_html(ruta):
    texto = open(ruta, encoding="utf-8").read()
    titulo, materia = datos_de_portada(texto)
    cuerpo = markdown_a_html(ruta)
    cuerpo = re.sub(r"<h1[^>]*>.*?</h1>", "", cuerpo, count=1, flags=re.S)    # el título ya está en la carátula
    logo = open(LOGO, encoding="utf-8").read().replace('width="512" height="512"', 'width="48" height="48"')
    portada = f"""
    <section class="caratula">
      <div><div class="franja"></div>
        <h1>{html.escape(titulo)}</h1>
        <p class="materia">{html.escape(materia)}</p></div>
      <dl>
        <dt>Escuela</dt><dd>Técnico en Informática · Proyecto final integrador (FAT y Emprendimiento)</dd>
        <dt>Profesora</dt><dd>Tamara Piccinni</dd>
        <dt>Agencia</dt><dd>SMAT, división de TOUCH</dd>
        <dt>Equipo</dt><dd>Toro (software y web) · Morena (hardware e IA)</dd>
        <dt>Fecha</dt><dd>{date.today():%d/%m/%Y}</dd>
        <dt>Repositorio</dt><dd>github.com/Code7C26/TOUCH-ID · docs/SMAT/</dd>
      </dl>
      <div class="marca">{logo}<span>DROID-E3D<small>by SMAT · una división de TOUCH</small></span></div>
    </section>"""
    return f"<!doctype html><html lang='es'><head><meta charset='utf-8'><style>{ESTILO}</style></head><body>{portada}{cuerpo}</body></html>"


def generar_pdf(pagina, ruta_md):
    carpeta_pdf = os.path.join(os.path.dirname(ruta_md), "pdf")
    os.makedirs(carpeta_pdf, exist_ok=True)
    destino = os.path.join(carpeta_pdf, os.path.basename(ruta_md)[:-3] + ".pdf")
    pagina.set_content(armar_html(ruta_md), wait_until="load")
    pagina.pdf(path=destino, format="A4", print_background=True, display_header_footer=True,
               header_template="<span></span>",
               footer_template="<div style='font-size:8px;width:100%;text-align:center;color:#888'>DROID-E3D by SMAT · página <span class='pageNumber'></span> de <span class='totalPages'></span></div>",
               margin={"top": "18mm", "bottom": "20mm", "left": "16mm", "right": "16mm"})
    print("PDF:", os.path.relpath(destino, RAIZ))


def exportar_canvas(navegador):
    origen = os.path.join(COMERCIAL, "canvas", "business-model-canvas.html")
    pagina = navegador.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
    pagina.goto("file:///" + origen.replace("\\", "/"))
    pagina.screenshot(path=os.path.join(COMERCIAL, "canvas", "business-model-canvas.png"))
    pagina.pdf(path=os.path.join(COMERCIAL, "canvas", "business-model-canvas.pdf"), width="1600px", height="1000px",
               print_background=True, page_ranges="1")
    pagina.close()
    print("Canvas: PNG y PDF")


if __name__ == "__main__":
    pedidos = sys.argv[1:] or sorted(os.path.join(COMERCIAL, f) for f in os.listdir(COMERCIAL) if re.match(r"\d\d-.*\.md$", f))
    with sync_playwright() as p:
        navegador = p.chromium.launch(channel=NAVEGADOR)
        if not sys.argv[1:]:
            exportar_canvas(navegador)
        pagina = navegador.new_page()
        for ruta in pedidos:
            generar_pdf(pagina, os.path.abspath(ruta))
        navegador.close()
