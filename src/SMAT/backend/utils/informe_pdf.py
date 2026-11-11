"""Informe mensual de cumplimiento de EPP en PDF (para la ART y las inspecciones). Se arma con reportlab.

Usa los mismos cálculos que la página Reportes (utils/reportes.py), así el PDF y la web dicen lo mismo.
"""
import io
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from models import Incidencia
from utils.reportes import en_periodo, ranking, resumen_diario

TINTA = colors.HexColor("#1f2328")
MARCA = colors.HexColor("#f5b800")
SERIE = colors.HexColor("#2a78d6")      # el mismo azul de los gráficos de la web
GRIS = colors.HexColor("#71717a")
LINEA = colors.HexColor("#e4e4e7")
FONDO = colors.HexColor("#f4f4f5")
NIVELES = {"Bien": colors.HexColor("#15803d"), "A mejorar": colors.HexColor("#c2410c"), "Riesgo": colors.HexColor("#b91c1c")}

NOMBRES_TIPO = {"sin_casco": "Sin casco", "sin_guantes": "Sin guantes", "sin_lentes": "Sin lentes", "sin_chaleco": "Sin chaleco"}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
ANCHO = A4[0] - 36 * mm   # ancho útil de la hoja

TITULO = ParagraphStyle("titulo", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=TINTA)
SUBTITULO = ParagraphStyle("subtitulo", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=TINTA, spaceBefore=12, spaceAfter=6)
TEXTO = ParagraphStyle("texto", fontName="Helvetica", fontSize=9, leading=12.5, textColor=GRIS)
NUMERO = ParagraphStyle("numero", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=TINTA)


def nombre_mes(fecha):
    return f"{MESES[fecha.month - 1]} de {fecha.year}"


def nivel(valor):
    return "Bien" if valor >= 90 else "A mejorar" if valor >= 75 else "Riesgo"


def fecha_corta(fecha):
    return fecha.strftime("%d/%m/%Y")


def tabla(filas, anchos, alinear_derecha=(), color_nivel=None):
    """Tabla con encabezado gris y líneas finas. color_nivel = índice de la columna "Nivel" (se pinta según el nivel)."""
    t = Table(filas, colWidths=anchos, repeatRows=1)
    estilo = [("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8), ("FONT", (0, 1), (-1, -1), "Helvetica", 8.5),
              ("TEXTCOLOR", (0, 0), (-1, 0), GRIS), ("BACKGROUND", (0, 0), (-1, 0), FONDO),
              ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINEA), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
              ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
    estilo += [("ALIGN", (col, 0), (col, -1), "RIGHT") for col in alinear_derecha]
    if color_nivel is not None:
        for fila, datos in enumerate(filas[1:], start=1):
            estilo.append(("TEXTCOLOR", (color_nivel, fila), (color_nivel, fila), NIVELES.get(datos[color_nivel], TINTA)))
            estilo.append(("FONT", (color_nivel, fila), (color_nivel, fila), "Helvetica-Bold", 8.5))
    t.setStyle(TableStyle(estilo))
    return t


def tarjetas(numeros):
    """Fila de 4 recuadros con un número grande y su descripción."""
    celdas = [[Paragraph(f"{escape(titulo)}", TEXTO), Paragraph(escape(str(valor)), NUMERO), Paragraph(escape(detalle), TEXTO)]
              for titulo, valor, detalle in numeros]
    t = Table([celdas], colWidths=[ANCHO / 4] * 4)
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINEA), ("INNERGRID", (0, 0), (-1, -1), 0.6, LINEA),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8)]))
    return t


def grafico_por_dia(dias):
    """Columnas con las alertas de cada día (etiqueta cada 5 días para que no se encimen)."""
    dibujo = Drawing(ANCHO, 52 * mm)
    g = VerticalBarChart()
    g.x, g.y, g.width, g.height = 22, 18, ANCHO - 30, 52 * mm - 26
    g.data = [[d["total"] for d in dias]]
    g.categoryAxis.categoryNames = [f"{d['fecha'][8:10]}/{d['fecha'][5:7]}" if n % 5 == 0 else "" for n, d in enumerate(dias)]
    g.categoryAxis.labels.fontSize = 7
    g.categoryAxis.labels.fontName = "Helvetica"
    g.categoryAxis.labels.fillColor = GRIS
    g.categoryAxis.strokeColor = LINEA
    maximo = max([d["total"] for d in dias] + [1])
    g.valueAxis.valueMin, g.valueAxis.valueMax = 0, maximo
    g.valueAxis.valueStep = max(1, round(maximo / 4))
    g.valueAxis.labels.fontSize = 7
    g.valueAxis.labels.fontName = "Helvetica"
    g.valueAxis.labels.fillColor = GRIS
    g.valueAxis.strokeColor = None
    g.valueAxis.visibleGrid = True
    g.valueAxis.gridStrokeColor = LINEA
    g.bars[0].fillColor = SERIE
    g.bars[0].strokeColor = None
    # Columnas finas: como mucho 6 mm de ancho, aunque el período tenga pocos días (el resto es aire)
    ancho_dia = g.width / len(dias)
    g.barWidth = min(ancho_dia * 0.7, 6 * mm)
    g.groupSpacing = ancho_dia - g.barWidth
    dibujo.add(g)
    return dibujo


def generar_informe_mensual(desde, hasta, mes, autor):
    """Devuelve los bytes del PDF del período (normalmente un mes completo, o hasta hoy si es el mes actual)."""
    d = resumen_diario(desde, hasta)
    r = ranking(desde, hasta)
    promedio = round(sum(e["cumplimiento"] for e in r["empleados"]) / len(r["empleados"])) if r["empleados"] else 0
    generado = datetime.now()

    partes = [
        Paragraph("DROID-E3D <font color='#b88a00'>by SMAT</font>", TEXTO),
        Paragraph(f"Informe de cumplimiento de EPP · {escape(mes.capitalize())}", TITULO),
        Paragraph(f"Período: {fecha_corta(desde)} al {fecha_corta(hasta)} ({r['dias']} días) · "
                  f"Generado el {generado:%d/%m/%Y %H:%M} por {escape(autor)}", TEXTO),
        Spacer(1, 10),
        tarjetas([("Alertas", d["total"], f"{d['activas']} sin resolver"),
                  ("Cumplimiento promedio", f"{promedio} %", "de los empleados activos"),
                  ("Resueltas", f"{round(d['resueltas'] * 100 / d['total']) if d['total'] else 0} %", f"{d['resueltas']} de {d['total']}"),
                  ("Paradas de máquina", d["paradas_maquina"], "por alertas de EPP")]),
        Paragraph("Alertas por día", SUBTITULO),
        grafico_por_dia(d["dias"]),
        Paragraph("Cumplimiento = días sin alertas / días del período. Bien: 90 % o más · A mejorar: 75 a 89 % · "
                  "Riesgo: menos de 75 %.", TEXTO),
    ]

    por_tipo = [["Equipo que faltó", "Alertas"]] + [[NOMBRES_TIPO[t["tipo"]], t["total"]] for t in d["por_tipo"]]
    por_zona = [["Zona", "Alertas", "Cumplimiento", "Nivel"]] + [
        [z["nombre"], z["alertas"], f"{z['cumplimiento']} %", nivel(z["cumplimiento"])] for z in r["zonas"]]
    lado_a_lado = Table([[tabla(por_tipo, [40 * mm, 20 * mm], (1,)), tabla(por_zona, [32 * mm, 18 * mm, 24 * mm, 22 * mm], (1, 2), 3)]],
                        colWidths=[66 * mm, ANCHO - 66 * mm])
    lado_a_lado.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    partes += [KeepTogether([Paragraph("Por tipo de EPP y por zona", SUBTITULO), lado_a_lado])]

    empleados = [["Empleado", "Legajo", "Zona", "Alertas", "Días con alerta", "Cumplimiento", "Nivel"]] + [
        [e["nombre"], e["legajo"] or "—", e["zona"] or "—", e["alertas"], e["dias_con_alerta"], f"{e['cumplimiento']} %", nivel(e["cumplimiento"])]
        for e in r["empleados"]]
    partes += [Paragraph("Ranking de cumplimiento por empleado", SUBTITULO),
               tabla(empleados, [44 * mm, 18 * mm, 20 * mm, 16 * mm, 24 * mm, 24 * mm, 20 * mm], (3, 4, 5), 6)]
    if r["alertas_sin_identificar"]:
        partes.append(Paragraph(f"{r['alertas_sin_identificar']} alertas no tienen persona identificada: cuentan para la zona, "
                                "no para ningún empleado.", TEXTO))

    detalle = [["Fecha y hora", "Zona", "Empleado", "Falta", "Confianza", "Estado"]] + [
        [f"{i.timestamp:%d/%m/%Y %H:%M}", i.zona.nombre if i.zona else "—", i.empleado.nombre if i.empleado else "No identificado",
         NOMBRES_TIPO.get(i.tipo, i.tipo), f"{round((i.confianza or 0) * 100)} %", i.estado.capitalize()]
        for i in Incidencia.query.filter(en_periodo(desde, hasta)).order_by(Incidencia.timestamp).all()]
    partes += [Paragraph(f"Detalle de las {d['total']} alertas", SUBTITULO)]
    partes += [tabla(detalle, [30 * mm, 22 * mm, 44 * mm, 26 * mm, 20 * mm, 32 * mm], (4,))] if d["total"] else [
        Paragraph("No hubo alertas en el período.", TEXTO)]

    # Dos líneas de firma separadas por un espacio en el medio
    firmas = Table([["", "", ""], ["Responsable de Higiene y Seguridad", "", "Encargado de planta"]],
                   colWidths=[ANCHO * 0.42, ANCHO * 0.16, ANCHO * 0.42], rowHeights=[22 * mm, None])
    firmas.setStyle(TableStyle([("LINEABOVE", (0, 1), (0, 1), 0.6, TINTA), ("LINEABOVE", (2, 1), (2, 1), 0.6, TINTA),
                                ("FONT", (0, 1), (-1, 1), "Helvetica", 8.5), ("TEXTCOLOR", (0, 1), (-1, 1), GRIS),
                                ("ALIGN", (0, 1), (-1, 1), "CENTER")]))
    partes += [KeepTogether([Spacer(1, 14), firmas])]

    def pie(lienzo, documento):
        """Franja amarilla arriba y número de página abajo, en todas las hojas."""
        lienzo.saveState()
        lienzo.setFillColor(MARCA)
        lienzo.rect(0, A4[1] - 5 * mm, A4[0], 5 * mm, stroke=0, fill=1)
        lienzo.setFont("Helvetica", 7.5)
        lienzo.setFillColor(GRIS)
        lienzo.drawString(18 * mm, 10 * mm, f"DROID-E3D by SMAT · Informe de {mes}")
        lienzo.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Página {documento.page}")
        lienzo.restoreState()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=14 * mm, bottomMargin=18 * mm,
                            title=f"Informe de cumplimiento de EPP - {mes}", author="DROID-E3D by SMAT")
    doc.build(partes, onFirstPage=pie, onLaterPages=pie)
    return buffer.getvalue()
