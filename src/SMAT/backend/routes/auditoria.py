"""Auditoría: el registro de quién hizo qué y cuándo (lo escribe utils/auditoria.py). Solo lo ve el encargado."""
from datetime import timedelta

from flask import Blueprint, request

from models import db, Auditoria, Usuario
from utils.decoradores import rol_requerido
from utils.validacion import leer_fecha

auditoria_bp = Blueprint("auditoria", __name__)


@auditoria_bp.route("/auditoria", methods=["GET"])
@rol_requerido("encargado")
def listar_auditoria():
    """Registros, del más nuevo al más viejo. Filtros opcionales:
    accion · usuario_id (un id, o "sistema" para lo que hicieron las máquinas) · desde / hasta (AAAA-MM-DD) ·
    q (busca en el detalle) · page y limit (por defecto 25, máximo 100).
    También devuelve las acciones y las personas que aparecen, para armar los filtros de la página."""
    args = request.args
    limite = min(max(args.get("limit", 25, type=int), 1), 100)
    pagina = max(args.get("page", 1, type=int), 1)
    consulta = Auditoria.query

    if args.get("accion"):
        consulta = consulta.filter(Auditoria.accion == args["accion"])
    if args.get("usuario_id") == "sistema":
        consulta = consulta.filter(Auditoria.usuario_id.is_(None))
    elif args.get("usuario_id"):
        if not args["usuario_id"].isdigit():
            return {"error": "'usuario_id' debe ser un número o 'sistema'"}, 400
        consulta = consulta.filter(Auditoria.usuario_id == int(args["usuario_id"]))
    if args.get("q", "").strip():
        consulta = consulta.filter(Auditoria.detalle.ilike(f"%{args['q'].strip()}%"))
    for nombre in ("desde", "hasta"):
        if args.get(nombre) and not leer_fecha(args[nombre]):
            return {"error": f"'{nombre}' debe tener formato AAAA-MM-DD"}, 400
    if args.get("desde"):
        consulta = consulta.filter(Auditoria.created_at >= leer_fecha(args["desde"]))
    if args.get("hasta"):   # "hasta" incluye todo ese día
        consulta = consulta.filter(Auditoria.created_at < leer_fecha(args["hasta"]) + timedelta(days=1))

    total = consulta.count()
    registros = (consulta.order_by(Auditoria.created_at.desc(), Auditoria.id.desc())
                 .offset((pagina - 1) * limite).limit(limite).all())

    acciones = [a for (a,) in db.session.query(Auditoria.accion).distinct().order_by(Auditoria.accion).all()]
    personas = (db.session.query(Usuario.id, Usuario.nombre).join(Auditoria, Auditoria.usuario_id == Usuario.id)
                .distinct().order_by(Usuario.nombre).all())
    return {"registros": [r.to_dict() for r in registros], "total": total, "page": pagina, "limit": limite,
            "acciones": acciones, "usuarios": [{"id": u_id, "nombre": nombre} for u_id, nombre in personas]}
