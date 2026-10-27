import mimetypes
import os

from flask import Flask, abort, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from models import db, obtener_robot
from routes.auth import auth_bp
from routes.incidents import incidents_bp
from routes.zones import zones_bp
from routes.users import users_bp
from routes.robot import robot_bp
from routes.rostros import rostros_bp
from routes.uploads import uploads_bp
from routes.push import push_bp
from routes.reports import reports_bp
from routes.comentarios import comentarios_bp
from routes.auditoria import auditoria_bp
from utils.archivos import crear_bucket, usa_supabase

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(incidents_bp, url_prefix="/api")
app.register_blueprint(zones_bp, url_prefix="/api")
app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(robot_bp, url_prefix="/api")
app.register_blueprint(rostros_bp, url_prefix="/api")
app.register_blueprint(uploads_bp, url_prefix="/api")
app.register_blueprint(push_bp, url_prefix="/api")
app.register_blueprint(reports_bp, url_prefix="/api")
app.register_blueprint(comentarios_bp, url_prefix="/api")
app.register_blueprint(auditoria_bp, url_prefix="/api")


@app.errorhandler(HTTPException)
def error_http(e):
    """Todos los errores (404, 405...) salen como JSON {"error": "..."} en vez de HTML."""
    return {"error": e.description}, e.code


@app.errorhandler(Exception)
def error_inesperado(e):
    """Red de seguridad: si algo falla sin control, se responde JSON (y el detalle queda en la consola)."""
    if isinstance(e, HTTPException):
        return error_http(e)
    app.logger.exception("Error inesperado")
    db.session.rollback()
    return {"error": "Error interno del servidor"}, 500


@app.errorhandler(413)
def archivo_muy_grande(e):
    return {"error": f"El archivo supera los {Config.MAX_IMAGEN_MB} MB"}, 413


@app.route("/api/health")
def health():
    return {"status": "ok", "mensaje": "Servidor Flask funcionando"}


# ---------- La web compilada (npm run build) ----------
# Si existe frontend/dist, Flask sirve también la web. Así la API y la web están en la misma dirección
# (en Render, o en la PC en http://localhost:5000) y no hace falta CORS. Ver docs/DESPLIEGUE.md.
mimetypes.add_type("application/manifest+json", ".webmanifest")   # el manifest de la PWA


@app.route("/", defaults={"ruta": ""})
@app.route("/<path:ruta>")
def web(ruta):
    carpeta = os.path.abspath(Config.WEB_DIST)
    if ruta.startswith("api/") or not os.path.isfile(os.path.join(carpeta, "index.html")):
        abort(404)   # las rutas de la API que no existen siguen respondiendo JSON
    if ruta and os.path.isfile(os.path.join(carpeta, ruta)):
        return send_from_directory(carpeta, ruta)            # archivos: JS, CSS, íconos, service worker...
    return send_from_directory(carpeta, "index.html")        # páginas (/app/panel...): las arma React


def crear_datos_iniciales():
    """Crea las tablas que falten. Los datos de ejemplo vienen de database/schema.sql."""
    db.create_all()
    obtener_robot()  # asegura que exista la fila del robot
    if db.engine.dialect.name == "postgresql":
        # Supabase publica las tablas por su propia API web. Con RLS (seguridad por fila) activado y sin
        # reglas, esa API no puede leer nada. Nuestro backend entra como dueño de las tablas: a él no lo afecta.
        for tabla in db.metadata.sorted_tables:
            db.session.execute(db.text(f'ALTER TABLE "{tabla.name}" ENABLE ROW LEVEL SECURITY'))
        db.session.commit()
    if usa_supabase():
        crear_bucket()   # el lugar donde se guardan las fotos en internet


if __name__ == "__main__":
    with app.app_context():
        crear_datos_iniciales()
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=Config.PORT)
