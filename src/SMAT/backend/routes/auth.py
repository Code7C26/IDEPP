from datetime import datetime, timedelta, timezone

import jwt
from flask import Blueprint, request

from config import Config
from models import db, Usuario
from utils.decoradores import token_required
from utils.validacion import leer_json

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = leer_json()
    usuario = data.get("usuario")
    contrasena = data.get("contrasena")

    if not usuario or not contrasena or not isinstance(usuario, str) or not isinstance(contrasena, str):
        return {"error": "Usuario y contraseña requeridos"}, 400
    if len(usuario) > 50 or len(contrasena) > 128:
        return {"error": "Credenciales inválidas"}, 401

    user = Usuario.query.filter_by(usuario=usuario).first()
    if not user or not user.check_password(contrasena):
        return {"error": "Credenciales inválidas"}, 401
    if not user.activo:
        return {"error": "Usuario dado de baja"}, 403

    token = jwt.encode(
        {"user_id": user.id, "rol": user.rol, "exp": datetime.now(timezone.utc) + timedelta(hours=24)},
        Config.JWT_SECRET,
        algorithm="HS256",
    )
    return {"token": token, **user.to_dict()}


@auth_bp.route("/me", methods=["GET"])
@token_required
def mi_perfil():
    """Datos del usuario con sesión, incluida su zona completa (EPP, máquina o puesto...)."""
    user = db.session.get(Usuario, request.user_id)
    if not user or not user.activo:
        return {"error": "Usuario no encontrado"}, 404
    return {**user.to_dict(), "zona_detalle": user.zona.to_dict() if user.zona else None}
