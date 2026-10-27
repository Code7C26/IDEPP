from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# default=...        lo pone Python cuando la app guarda algo.
# server_default=... lo pone la base cuando se inserta con SQL directo. Son los mismos DEFAULT que
#                    database/schema.sql; hacen falta en Postgres (Supabase), donde las tablas se
#                    crean desde estos modelos y no desde schema.sql.


class Zona(db.Model):
    """Una zona de la fábrica: tiene una máquina y un EPP obligatorio."""
    __tablename__ = "zonas"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    maquina = db.Column(db.String(100))                        # ej. "Sierra circular"
    epp_requerido = db.Column(db.String(200), default="", server_default="")      # texto: "casco,guantes,lentes"
    maquina_activa = db.Column(db.Boolean, default=True, server_default=db.true())       # False = la máquina debe estar parada
    # Posición en el mapa de la fábrica (grilla): x, y, ancho y alto en celdas
    grilla_x = db.Column(db.Integer, default=0, server_default="0")
    grilla_y = db.Column(db.Integer, default=0, server_default="0")
    ancho = db.Column(db.Integer, default=2, server_default="2")
    alto = db.Column(db.Integer, default=2, server_default="2")

    def to_dict(self):
        epp = [e for e in (self.epp_requerido or "").split(",") if e]
        return {
            "id": self.id, "nombre": self.nombre, "maquina": self.maquina,
            "epp_requerido": epp, "maquina_activa": self.maquina_activa,
            "grilla_x": self.grilla_x, "grilla_y": self.grilla_y,
            "ancho": self.ancho, "alto": self.alto,
        }


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False)     # hash, nunca la clave en texto
    nombre = db.Column(db.String(100), nullable=False)
    legajo = db.Column(db.String(20), unique=True)             # número de legajo del empleado
    rol = db.Column(db.Enum("empleado", "encargado", name="rol_usuario"), nullable=False)   # name: lo pide Postgres
    zona_id = db.Column(db.Integer, db.ForeignKey("zonas.id"))
    activo = db.Column(db.Boolean, default=True, server_default=db.true())               # False = dado de baja
    created_at = db.Column(db.DateTime, default=datetime.now, server_default=db.func.now())

    zona = db.relationship("Zona", backref="usuarios")

    def set_password(self, password):
        self.contrasena = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.contrasena, password)

    def to_dict(self):
        return {
            "id": self.id, "usuario": self.usuario, "nombre": self.nombre,
            "legajo": self.legajo, "rol": self.rol, "activo": self.activo,
            "zona_id": self.zona_id,
            "zona": self.zona.nombre if self.zona else None,   # nombre, para la web
        }


class Incidencia(db.Model):
    __tablename__ = "incidencias"

    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)            # sin_casco, sin_guantes...
    timestamp = db.Column(db.DateTime, default=datetime.now, server_default=db.func.now())
    zona_id = db.Column(db.Integer, db.ForeignKey("zonas.id"), nullable=False)
    empleado_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"))
    confianza = db.Column(db.Float, default=0.0, server_default="0")               # 0 a 1 (viene de YOLO)
    estado = db.Column(db.String(20), default="activa", server_default="activa")        # activa / resuelta
    imagen_url = db.Column(db.String(255))                     # foto de evidencia
    resuelta_por = db.Column(db.Integer, db.ForeignKey("usuarios.id"))
    resuelta_at = db.Column(db.DateTime)

    zona = db.relationship("Zona", backref="incidencias")
    empleado = db.relationship("Usuario", foreign_keys=[empleado_id], backref="incidencias")
    resolutor = db.relationship("Usuario", foreign_keys=[resuelta_por])   # quién la resolvió

    def to_dict(self):
        return {
            "id": self.id,
            "tipo": self.tipo,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "zona_id": self.zona_id,
            "zona": self.zona.nombre if self.zona else None,
            "empleado_id": self.empleado_id,
            "empleado_nombre": self.empleado.nombre if self.empleado else "Desconocido",
            "confianza": self.confianza,
            "estado": self.estado,
            "imagen_url": self.imagen_url,
            "resuelta_por": self.resuelta_por,
            "resuelta_por_nombre": self.resolutor.nombre if self.resolutor else None,
            "resuelta_at": self.resuelta_at.isoformat() if self.resuelta_at else None,
            "cantidad_comentarios": len(self.comentarios),
        }


class FotoRostro(db.Model):
    """Foto de la cara de un empleado (con su consentimiento), para el reconocimiento facial."""
    __tablename__ = "fotos_rostro"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    ruta_archivo = db.Column(db.String(255), nullable=False)     # "/uploads/rostros/3_a1b2c3d4.jpg"
    consentimiento_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    cargada_por = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"))

    usuario = db.relationship("Usuario", foreign_keys=[usuario_id], backref="fotos_rostro")

    def to_dict(self):
        return {"id": self.id, "usuario_id": self.usuario_id, "url": self.ruta_archivo,
                "consentimiento_at": self.consentimiento_at.isoformat() if self.consentimiento_at else None}


class Comentario(db.Model):
    """Comentario sobre una alerta. Lo escriben el encargado o el empleado detectado."""
    __tablename__ = "comentarios"

    id = db.Column(db.Integer, primary_key=True)
    incidencia_id = db.Column(db.Integer, db.ForeignKey("incidencias.id", ondelete="CASCADE"), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"))
    texto = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now, server_default=db.func.now())

    incidencia = db.relationship("Incidencia", backref=db.backref("comentarios", cascade="all, delete-orphan",
                                                                 passive_deletes=True, order_by="Comentario.id"))
    usuario = db.relationship("Usuario")

    def to_dict(self):
        return {
            "id": self.id, "incidencia_id": self.incidencia_id, "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre if self.usuario else "Usuario borrado",
            "usuario_rol": self.usuario.rol if self.usuario else None,
            "texto": self.texto,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SuscripcionPush(db.Model):
    """Un navegador (celular o PC) donde el usuario activó las notificaciones push.
    Los datos los da el navegador al suscribirse: a dónde mandar (endpoint) y con qué cifrar (p256dh, auth)."""
    __tablename__ = "suscripciones_push"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    endpoint = db.Column(db.String(500), unique=True, nullable=False)
    p256dh = db.Column(db.String(255), nullable=False)
    auth = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now, server_default=db.func.now())


class Auditoria(db.Model):
    """Registro de quién hizo qué y cuándo (acciones del encargado, parada de máquina...)."""
    __tablename__ = "auditoria"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"))   # None = una máquina (YOLO/ESP32)
    accion = db.Column(db.String(50), nullable=False)                  # ej. "resolver_incidencia"
    detalle = db.Column(db.String(255), default="", server_default="")
    created_at = db.Column(db.DateTime, default=datetime.now, server_default=db.func.now())

    usuario = db.relationship("Usuario")

    def to_dict(self):
        return {
            "id": self.id, "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre if self.usuario else "Sistema",
            "accion": self.accion, "detalle": self.detalle,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Robot(db.Model):
    """Estado del robot. Hay una sola fila (id = 1)."""
    __tablename__ = "robot"

    ESTADOS = ("detenido", "recorriendo", "pausado", "emergencia")
    COMANDOS = ("iniciar", "pausar", "detener", "emergencia")

    id = db.Column(db.Integer, primary_key=True)
    estado = db.Column(db.String(20), default="detenido", server_default="detenido")
    bateria = db.Column(db.Integer, default=100, server_default="100")                 # porcentaje 0 a 100
    zona_actual_id = db.Column(db.Integer, db.ForeignKey("zonas.id"))
    comando_pendiente = db.Column(db.String(20))                 # lo que el robot todavía no ejecutó
    url_video = db.Column(db.String(255), default="", server_default="")            # stream MJPEG del servidor de IA
    ultima_conexion = db.Column(db.DateTime)                     # último reporte del ESP32

    zona_actual = db.relationship("Zona")

    def conectado(self):
        """El robot se considera conectado si reportó en los últimos 10 segundos."""
        return bool(self.ultima_conexion) and (datetime.now() - self.ultima_conexion).total_seconds() <= 10

    def to_dict(self):
        return {
            "estado": self.estado, "bateria": self.bateria,
            "zona_actual_id": self.zona_actual_id,
            "zona_actual": self.zona_actual.nombre if self.zona_actual else None,
            "comando_pendiente": self.comando_pendiente, "url_video": self.url_video,
            "ultima_conexion": self.ultima_conexion.isoformat() if self.ultima_conexion else None,
            "conectado": self.conectado(),
        }


class PuntoRuta(db.Model):
    """Un paso de la ruta del robot: ir a una zona y esperar unos segundos."""
    __tablename__ = "puntos_ruta"

    id = db.Column(db.Integer, primary_key=True)
    orden = db.Column(db.Integer, nullable=False)
    zona_id = db.Column(db.Integer, db.ForeignKey("zonas.id"), nullable=False)
    tiempo_espera_seg = db.Column(db.Integer, default=30, server_default="30")

    zona = db.relationship("Zona")

    def to_dict(self):
        return {"id": self.id, "orden": self.orden, "zona_id": self.zona_id,
                "zona": self.zona.nombre if self.zona else None,
                "tiempo_espera_seg": self.tiempo_espera_seg}


def obtener_robot():
    """Devuelve la fila del robot; la crea si todavía no existe."""
    robot = db.session.get(Robot, 1)
    if not robot:
        robot = Robot(id=1)
        db.session.add(robot)
        db.session.commit()
    return robot
