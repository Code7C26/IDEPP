"""Reportes para el encargado: alertas por día, tipo y zona, ranking de cumplimiento y descargas (CSV y PDF).
Los cálculos están en utils/reportes.py y el PDF en utils/informe_pdf.py."""
import csv
import io
from datetime import date, datetime, timedelta

from flask import Blueprint, Response, request

from models import db, Incidencia, Usuario
from utils.auditoria import registrar
from utils.decoradores import rol_requerido
from utils.informe_pdf import NOMBRES_TIPO, generar_informe_mensual, nombre_mes
from utils.reportes import en_periodo, ranking, resumen_diario
from utils.validacion import leer_fecha

reports_bp = Blueprint("reports", __name__)

DIAS_POR_DEFECTO = 30
MAX_DIAS = 366


def leer_periodo():
    """Lee ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD. Por defecto: los últimos 30 días contando hoy.
    Devuelve (desde, hasta, None) o (None, None, mensaje de error)."""
    for nombre in ("desde", "hasta"):
        if request.args.get(nombre) and not leer_fecha(request.args[nombre]):
            return None, None, f"'{nombre}' debe tener formato AAAA-MM-DD"
    hasta = leer_fecha(request.args.get("hasta"))
    hasta = hasta.date() if hasta else date.today()
    desde = leer_fecha(request.args.get("desde"))
    desde = desde.date() if desde else hasta - timedelta(days=DIAS_POR_DEFECTO - 1)
    if desde > hasta:
        return None, None, "'desde' no puede ser posterior a 'hasta'"
    if (hasta - desde).days + 1 > MAX_DIAS:
        return None, None, f"El período puede tener como máximo {MAX_DIAS} días"
    return desde, hasta, None


@reports_bp.route("/reports/diario", methods=["GET"])
@rol_requerido("encargado")
def reporte_diario():
    """Alertas de cada día del período (por tipo), totales por tipo y por zona, activas/resueltas y paradas de máquina."""
    desde, hasta, error = leer_periodo()
    if error:
        return {"error": error}, 400
    return resumen_diario(desde, hasta)


@reports_bp.route("/reports/ranking", methods=["GET"])
@rol_requerido("encargado")
def reporte_ranking():
    """Cumplimiento (días sin alertas / días del período) de cada empleado activo y de cada zona."""
    desde, hasta, error = leer_periodo()
    if error:
        return {"error": error}, 400
    return ranking(desde, hasta)


def celda_segura(valor):
    """Excel ejecuta como fórmula lo que empieza con = + - @ (alguien podría cargar un nombre así a propósito):
    a esas celdas se les agrega un apóstrofo adelante para que se vean como texto."""
    texto = "" if valor is None else str(valor)
    return "'" + texto if texto[:1] in ("=", "+", "-", "@", "\t", "\r") else texto


@reports_bp.route("/reports/incidencias.csv", methods=["GET"])
@rol_requerido("encargado")
def exportar_csv():
    """Todas las alertas del período en CSV. Separado por ";" y con BOM, para que Excel en español
    lo abra directo con los acentos bien."""
    desde, hasta, error = leer_periodo()
    if error:
        return {"error": error}, 400
    salida = io.StringIO()
    escritor = csv.writer(salida, delimiter=";", lineterminator="\r\n")
    escritor.writerow(["ID", "Fecha", "Hora", "Zona", "Empleado", "Legajo", "Falta", "Confianza (%)", "Estado",
                       "Resuelta por", "Resuelta el"])
    incidencias = Incidencia.query.filter(en_periodo(desde, hasta)).order_by(Incidencia.timestamp).all()
    for i in incidencias:
        escritor.writerow([celda_segura(v) for v in (
            i.id, f"{i.timestamp:%d/%m/%Y}", f"{i.timestamp:%H:%M}", i.zona.nombre if i.zona else "",
            i.empleado.nombre if i.empleado else "No identificado", i.empleado.legajo if i.empleado else "",
            NOMBRES_TIPO.get(i.tipo, i.tipo), round((i.confianza or 0) * 100), i.estado,
            i.resolutor.nombre if i.resolutor else "", f"{i.resuelta_at:%d/%m/%Y %H:%M}" if i.resuelta_at else "")])
    registrar("exportar_csv", f"Alertas del {desde:%d/%m/%Y} al {hasta:%d/%m/%Y} ({len(incidencias)} filas)")
    db.session.commit()
    nombre = f"alertas_{desde.isoformat()}_a_{hasta.isoformat()}.csv"
    return Response("\ufeff" + salida.getvalue(), mimetype="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{nombre}"'})


@reports_bp.route("/reports/mensual.pdf", methods=["GET"])
@rol_requerido("encargado")
def informe_mensual():
    """Informe del mes ?mes=AAAA-MM (por defecto el actual) en PDF. Si es el mes en curso, llega hasta hoy."""
    texto = request.args.get("mes") or date.today().strftime("%Y-%m")
    try:
        inicio = datetime.strptime(texto, "%Y-%m").date()
    except ValueError:
        return {"error": "'mes' debe tener formato AAAA-MM"}, 400
    hoy = date.today()
    if inicio > hoy:
        return {"error": "Ese mes todavía no empezó"}, 400
    ultimo_dia = (inicio.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    autor = db.session.get(Usuario, request.user_id).nombre
    pdf = generar_informe_mensual(inicio, min(ultimo_dia, hoy), nombre_mes(inicio), autor)
    registrar("exportar_pdf", f"Informe mensual de {nombre_mes(inicio)}")
    db.session.commit()
    return Response(pdf, mimetype="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="informe-epp-{inicio:%Y-%m}.pdf"'})
