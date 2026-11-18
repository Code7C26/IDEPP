"""Decoradores para proteger rutas. Se usan arriba de cada función de ruta."""
import hmac
from functools import wraps

import jwt
from flask import request

from config import Config


def token_required(f):
    """Exige un usuario con sesión: header  Authorization: Bearer <token>."""
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return {"error": "Token requerido"}, 401
        try:
            datos = jwt.decode(header.split(" ")[1], Config.JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            return {"error": "Token expirado o inválido"}, 401
        # Se mira la base en cada pedido: si lo dieron de baja o le cambiaron el rol,
        # vale desde ese momento (no recién cuando vence el token, a las 24 h)
        from models import db, Usuario   # acá adentro para no importar en círculo
        usuario = db.session.get(Usuario, datos.get("user_id")) if isinstance(datos.get("user_id"), int) else None
        if not usuario or not usuario.activo:
            return {"error": "Tu sesión ya no es válida. Volvé a ingresar."}, 401
        request.user_id = usuario.id
        request.user_rol = usuario.rol
        return f(*args, **kwargs)
    return decorated


def rol_requerido(*roles):
    """Además de tener sesión, exige que el rol sea uno de los indicados.
    Ejemplo:  @rol_requerido("encargado")"""
    def decorador(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.user_rol not in roles:
                return {"error": "No tenés permiso para esta acción"}, 403
            return f(*args, **kwargs)
        return decorated
    return decorador


def sesion_o_api_key(*nombres_clave):
    """Para datos de solo lectura que pueden ver tanto las personas (con token) como las
    programas de la IA y del robot (con X-API-KEY de cualquiera de las claves indicadas)."""
    def decorador(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            enviada = request.headers.get("X-API-KEY")
            if enviada:
                for nombre in nombres_clave:
                    esperada = getattr(Config, nombre, "")
                    if esperada and hmac.compare_digest(enviada, esperada):
                        return f(*args, **kwargs)
                return {"error": "Clave de API inválida"}, 401
            return token_required(f)(*args, **kwargs)
        return decorated
    return decorador


def api_key_requerida(nombre_clave):
    """Para los programas (la IA y el ESP32 del robot): exige el header  X-API-KEY.
    `nombre_clave` es el nombre en Config, ej. "YOLO_API_KEY" o "ROBOT_API_KEY"."""
    def decorador(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            esperada = getattr(Config, nombre_clave, "")
            if not esperada:
                return {"error": f"El servidor no tiene configurada la clave {nombre_clave}"}, 503
            enviada = request.headers.get("X-API-KEY", "")
            # compare_digest evita que se pueda adivinar la clave midiendo tiempos
            if not hmac.compare_digest(enviada, esperada):
                return {"error": "Clave de API inválida"}, 401
            return f(*args, **kwargs)
        return decorated
    return decorador
