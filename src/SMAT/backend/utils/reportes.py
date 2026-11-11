"""Cálculos de los reportes (los usan la API de reportes y el PDF mensual).

Cumplimiento: es la misma definición que ve el empleado en su inicio (frontend/src/utils/cumplimiento.js):
    un día "cumple" si ese día no hubo ninguna alerta  ->  cumplimiento = días sin alertas / días del período
"""
from datetime import datetime, time, timedelta

from models import db, Auditoria, Incidencia, Usuario, Zona

TIPOS = ("sin_casco", "sin_guantes", "sin_lentes", "sin_chaleco")


def limites(desde, hasta):
    """Del primer instante de 'desde' al primer instante del día siguiente a 'hasta' (incluye todo 'hasta')."""
    return datetime.combine(desde, time.min), datetime.combine(hasta + timedelta(days=1), time.min)


def en_periodo(desde, hasta):
    """Condición SQL: la incidencia ocurrió dentro del período."""
    inicio, fin = limites(desde, hasta)
    return db.and_(Incidencia.timestamp >= inicio, Incidencia.timestamp < fin)


def cantidad_de_dias(desde, hasta):
    return (hasta - desde).days + 1


def cumplimiento(dias_con_alerta, dias):
    return round((dias - dias_con_alerta) * 100 / dias)


def resumen_diario(desde, hasta):
    """Alertas por día (separadas por tipo), por tipo, por zona y totales del período."""
    dia = db.func.date(Incidencia.timestamp)
    conteo = {}   # (fecha, tipo) -> cantidad
    for fecha, tipo, cantidad in (db.session.query(dia, Incidencia.tipo, db.func.count(Incidencia.id))
                                  .filter(en_periodo(desde, hasta)).group_by(dia, Incidencia.tipo).all()):
        conteo[(fecha, tipo)] = cantidad

    dias = []
    for n in range(cantidad_de_dias(desde, hasta)):   # todos los días, aunque no tengan alertas
        fecha = desde + timedelta(days=n)
        por_tipo = {tipo: conteo.get((fecha, tipo), 0) for tipo in TIPOS}
        dias.append({"fecha": fecha.isoformat(), **por_tipo, "total": sum(por_tipo.values())})

    # Todas las zonas, aunque no tengan alertas (outer join con la condición del período en el join)
    zonas = (db.session.query(Zona.id, Zona.nombre, db.func.count(Incidencia.id))
             .outerjoin(Incidencia, db.and_(Incidencia.zona_id == Zona.id, en_periodo(desde, hasta)))
             .group_by(Zona.id, Zona.nombre).order_by(Zona.nombre).all())

    inicio, fin = limites(desde, hasta)
    activas = Incidencia.query.filter(en_periodo(desde, hasta), Incidencia.estado == "activa").count()
    total = sum(d["total"] for d in dias)
    return {
        "desde": desde.isoformat(), "hasta": hasta.isoformat(),
        "dias": dias,
        "por_tipo": [{"tipo": tipo, "total": sum(d[tipo] for d in dias)} for tipo in TIPOS],
        "por_zona": [{"zona_id": z_id, "zona": nombre, "total": cantidad} for z_id, nombre, cantidad in zonas],
        "total": total,
        "activas": activas,
        "resueltas": total - activas,
        "paradas_maquina": Auditoria.query.filter(Auditoria.accion == "parada_maquina",
                                                  Auditoria.created_at >= inicio, Auditoria.created_at < fin).count(),
    }


def ranking(desde, hasta):
    """Cumplimiento de cada empleado activo y de cada zona en el período (los que mejor cumplen, primero)."""
    dias = cantidad_de_dias(desde, hasta)
    dias_distintos = db.func.count(db.distinct(db.func.date(Incidencia.timestamp)))

    por_empleado = {e_id: (alertas, con_alerta) for e_id, alertas, con_alerta in
                    db.session.query(Incidencia.empleado_id, db.func.count(Incidencia.id), dias_distintos)
                    .filter(en_periodo(desde, hasta), Incidencia.empleado_id.isnot(None))
                    .group_by(Incidencia.empleado_id).all()}
    empleados = []
    for u in Usuario.query.filter_by(rol="empleado", activo=True).all():
        alertas, con_alerta = por_empleado.get(u.id, (0, 0))
        empleados.append({"id": u.id, "nombre": u.nombre, "legajo": u.legajo, "zona": u.zona.nombre if u.zona else None,
                          "alertas": alertas, "dias_con_alerta": con_alerta, "cumplimiento": cumplimiento(con_alerta, dias)})

    por_zona = {z_id: (alertas, con_alerta) for z_id, alertas, con_alerta in
                db.session.query(Incidencia.zona_id, db.func.count(Incidencia.id), dias_distintos)
                .filter(en_periodo(desde, hasta)).group_by(Incidencia.zona_id).all()}
    zonas = []
    for z in Zona.query.all():
        alertas, con_alerta = por_zona.get(z.id, (0, 0))
        asignados = Usuario.query.filter_by(zona_id=z.id, rol="empleado", activo=True).count()
        zonas.append({"id": z.id, "nombre": z.nombre, "empleados": asignados,
                      "alertas": alertas, "dias_con_alerta": con_alerta, "cumplimiento": cumplimiento(con_alerta, dias)})

    # Mejor cumplimiento primero; si empatan, menos alertas; si siguen empatados, por nombre
    def orden(fila):
        return (-fila["cumplimiento"], fila["alertas"], fila["nombre"])

    sin_identificar = Incidencia.query.filter(en_periodo(desde, hasta), Incidencia.empleado_id.is_(None)).count()
    return {"desde": desde.isoformat(), "hasta": hasta.isoformat(), "dias": dias,
            "empleados": sorted(empleados, key=orden), "zonas": sorted(zonas, key=orden),
            "alertas_sin_identificar": sin_identificar}
