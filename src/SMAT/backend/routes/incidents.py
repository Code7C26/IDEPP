from datetime import datetime, timedelta

from flask import Blueprint, request
from sqlalchemy import or_

from models import db, Incidencia, Usuario, Zona, obtener_robot
from utils.archivos import AlmacenNoDisponible, ImagenInvalida, guardar_imagen
from utils.auditoria import registrar
from utils.decoradores import token_required, rol_requerido, api_key_requerida
from utils.push import notificar_alerta
from utils.validacion import id_valido, leer_fecha, leer_json

incidents_bp = Blueprint("incidents", __name__)

TIPOS_VALIDOS = ("sin_casco", "sin_guantes", "sin_lentes", "sin_chaleco")

# Columnas por las que se puede ordenar la lista (?orden=confianza  o  ?orden=-confianza para al revés)
ORDENES = {"timestamp": Incidencia.timestamp, "zona": Zona.nombre, "empleado": Usuario.nombre,
           "tipo": Incidencia.tipo, "confianza": Incidencia.confianza, "estado": Incidencia.estado}


def leer_formulario():
    """Datos de un envío multipart (con foto). Todo llega como texto, así que se convierte
    al mismo formato que el JSON. Si un número no se entiende, se deja el texto y la validación lo rechaza."""
    datos = dict(request.form)
    for campo, convertir in (("zona_id", int), ("empleado_id", int), ("confianza", float)):
        valor = datos.get(campo, "").strip()
        if valor in ("", "null"):
            datos.pop(campo, None)
        else:
            try:
                datos[campo] = convertir(valor)
            except ValueError:
                pass
    return datos


@incidents_bp.route("/incidents", methods=["GET"])
@token_required
def listar_incidencias():
    """Lista alertas. El empleado ve SOLO las suyas; el encargado ve todas.
    Filtros opcionales: zona_id, zona (nombre), empleado_id, tipo, estado, desde, hasta (AAAA-MM-DD),
    q (busca en el nombre del empleado o de la zona) y orden (ej. "zona", "-confianza"; por defecto "-timestamp")."""
    args = request.args
    limite = min(max(args.get("limit", 20, type=int), 1), 200)
    pagina = max(args.get("page", 1, type=int), 1)

    # Se une con la zona y el empleado para poder filtrar, buscar y ordenar por sus nombres
    consulta = Incidencia.query.join(Zona, Incidencia.zona_id == Zona.id).outerjoin(Usuario, Incidencia.empleado_id == Usuario.id)

    if request.user_rol == "empleado":
        consulta = consulta.filter(Incidencia.empleado_id == request.user_id)
    elif args.get("empleado_id", type=int):
        consulta = consulta.filter(Incidencia.empleado_id == args.get("empleado_id", type=int))

    if args.get("zona_id", type=int):
        consulta = consulta.filter(Incidencia.zona_id == args.get("zona_id", type=int))
    if args.get("zona"):
        consulta = consulta.filter(Zona.nombre == args["zona"])
    if args.get("tipo"):
        consulta = consulta.filter(Incidencia.tipo == args["tipo"])
    if args.get("estado"):
        consulta = consulta.filter(Incidencia.estado == args["estado"])
    if args.get("q", "").strip():
        patron = f"%{args['q'].strip()}%"
        consulta = consulta.filter(or_(Usuario.nombre.ilike(patron), Zona.nombre.ilike(patron)))

    orden = args.get("orden", "-timestamp")
    columna = ORDENES.get(orden.lstrip("-"))
    if columna is None:
        return {"error": f"'orden' debe ser uno de: {', '.join(ORDENES)} (con '-' adelante para al revés)"}, 400

    for nombre in ("desde", "hasta"):
        if args.get(nombre) and not leer_fecha(args[nombre]):
            return {"error": f"'{nombre}' debe tener formato AAAA-MM-DD"}, 400
    desde, hasta = leer_fecha(args.get("desde")), leer_fecha(args.get("hasta"))
    if desde:
        consulta = consulta.filter(Incidencia.timestamp >= desde)
    if hasta:  # "hasta" incluye todo ese día
        consulta = consulta.filter(Incidencia.timestamp < hasta + timedelta(days=1))

    total = consulta.count()
    # Desempate por id para que el paginado no repita ni saltee filas con el mismo valor
    incidencias = (consulta.order_by(columna.desc() if orden.startswith("-") else columna.asc(), Incidencia.id.desc())
                   .offset((pagina - 1) * limite).limit(limite).all())
    return {"incidencias": [i.to_dict() for i in incidencias],
            "total": total, "page": pagina, "limit": limite}


@incidents_bp.route("/stats", methods=["GET"])
@rol_requerido("encargado")
def estadisticas():
    """Números del panel. "Semana" = los últimos 7 días calendario contando hoy.
    serie_14_dias: alertas por día (la más vieja primero, la última es hoy), para los mini gráficos."""
    inicio_hoy = datetime.combine(datetime.now().date(), datetime.min.time())
    inicio_quincena = inicio_hoy - timedelta(days=13)

    por_dia = dict(
        db.session.query(db.func.date(Incidencia.timestamp), db.func.count(Incidencia.id))
        .filter(Incidencia.timestamp >= inicio_quincena)
        .group_by(db.func.date(Incidencia.timestamp)).all()
    )
    dias = [(inicio_quincena + timedelta(days=n)).date() for n in range(14)]
    serie = [{"fecha": d.isoformat(), "total": por_dia.get(d, 0)} for d in dias]

    top_zonas = (
        db.session.query(Zona.nombre, db.func.count(Incidencia.id))
        .join(Incidencia, Incidencia.zona_id == Zona.id)
        .group_by(Zona.id, Zona.nombre)
        .order_by(db.func.count(Incidencia.id).desc())
        .limit(3)
        .all()
    )
    return {
        "incidencias_hoy": serie[-1]["total"],
        "incidencias_ayer": serie[-2]["total"],
        "incidencias_semana": sum(d["total"] for d in serie[7:]),
        "incidencias_semana_anterior": sum(d["total"] for d in serie[:7]),
        "serie_14_dias": serie,
        "incidencias_activas": Incidencia.query.filter_by(estado="activa").count(),
        "empleados_activos": Usuario.query.filter_by(rol="empleado", activo=True).count(),
        "top_zonas": [{"zona": z, "incidencias": c} for z, c in top_zonas],
    }


@incidents_bp.route("/incidents", methods=["POST"])
@api_key_requerida("YOLO_API_KEY")
def crear_incidencia():
    """La llama el servidor YOLO cuando detecta a alguien sin EPP (header X-API-KEY).
    Body JSON: tipo, zona_id (o zona = nombre; si no viene, la zona actual del robot),
    empleado_id (o empleado = nombre; opcional), confianza (0 a 1).
    También acepta multipart/form-data con esos campos más "imagen" (JPG/PNG, máx. 5 MB): la foto de evidencia."""
    multipart = request.content_type and request.content_type.startswith("multipart/form-data")
    data = leer_formulario() if multipart else leer_json()
    imagen = request.files.get("imagen") if multipart else None

    if data.get("tipo") not in TIPOS_VALIDOS:
        return {"error": f"'tipo' debe ser uno de: {', '.join(TIPOS_VALIDOS)}"}, 400

    zona = db.session.get(Zona, data["zona_id"]) if id_valido(data.get("zona_id")) else None
    if not zona and isinstance(data.get("zona"), str) and data["zona"]:
        zona = Zona.query.filter_by(nombre=data["zona"]).first()
    elif not zona and data.get("zona_id") is None and not data.get("zona"):
        # Sin zona: la cámara va en el robot, así que se usa la zona que el robot reportó
        zona = obtener_robot().zona_actual
    if not zona:
        return {"error": "Zona inexistente: indicá 'zona_id' o 'zona' (o que el robot reporte en qué zona está)"}, 400

    empleado_id = data.get("empleado_id")
    if empleado_id is not None and not (id_valido(empleado_id) and db.session.get(Usuario, empleado_id)):
        return {"error": "empleado_id inexistente"}, 400
    if empleado_id is None and isinstance(data.get("empleado"), str) and data["empleado"].strip():
        # La IA reconoce por nombre (el de la carpeta de fotos). Si no hay nadie con ese nombre
        # (o es "Desconocido"), la alerta queda sin empleado en vez de perderse.
        nombre = str(data["empleado"]).strip()
        encontrado = Usuario.query.filter(db.func.lower(Usuario.nombre) == nombre.lower(), Usuario.activo.is_(True)).first()
        empleado_id = encontrado.id if encontrado else None

    confianza = data.get("confianza", 0.0)
    if not isinstance(confianza, (int, float)) or isinstance(confianza, bool) or not 0 <= confianza <= 1:
        return {"error": "'confianza' debe ser un número entre 0 y 1"}, 400

    inc = Incidencia(tipo=data["tipo"], zona_id=zona.id, empleado_id=empleado_id, confianza=confianza)
    db.session.add(inc)
    db.session.flush()  # para conocer el id de la incidencia (se usa en el nombre de la foto y en la auditoría)

    if imagen:
        try:
            inc.imagen_url = guardar_imagen(imagen, "evidencias", inc.id)
        except ImagenInvalida as e:
            db.session.rollback()
            return {"error": str(e)}, 400
        except AlmacenNoDisponible as e:
            # La alerta y la parada de la máquina importan más que la foto: se guarda igual, sin foto
            print(f"[AVISO] Alerta #{inc.id} sin foto: {e}")

    # Seguridad: si la zona tiene máquina, se detiene hasta que el encargado la reactive.
    # La parada la hace el sistema (no una persona), por eso queda en auditoría sin usuario.
    parada = bool(zona.maquina and zona.maquina_activa)
    if parada:
        zona.maquina_activa = False
        registrar("parada_maquina", f"Zona '{zona.nombre}': máquina detenida por la incidencia #{inc.id} ({inc.tipo})")
    db.session.commit()
    notificar_alerta(inc, parada)   # notificación push a los encargados y al empleado (si la activaron)
    return {**inc.to_dict(), "maquina_detenida": parada}, 201


@incidents_bp.route("/incidents/<int:inc_id>/resolver", methods=["PUT"])
@rol_requerido("encargado")
def resolver_incidencia(inc_id):
    inc = db.get_or_404(Incidencia, inc_id)
    if inc.estado == "resuelta":
        return {"error": "La incidencia ya estaba resuelta"}, 409
    inc.estado = "resuelta"
    inc.resuelta_por = request.user_id
    inc.resuelta_at = datetime.now()
    registrar("resolver_incidencia", f"Incidencia #{inc.id} ({inc.tipo}, {inc.zona.nombre})")
    db.session.commit()
    return inc.to_dict()
