#!/bin/bash
# Instala (o actualiza) DROID-E3D en PythonAnywhere. Ver docs/DESPLIEGUE.md.
#
# Antes: subir droid-e3d.tgz a /home/<usuario>/ y descomprimirlo (tar -xzf droid-e3d.tgz).
# Uso, en una consola Bash de PythonAnywhere:
#     bash ~/droid-e3d/backend/tools/instalar_pythonanywhere.sh
#
# La primera vez pide la contraseña de MySQL y un mail de contacto, genera todas las claves,
# escribe el .env y carga los datos de ejemplo. Si el .env ya existe (una actualización),
# solo reinstala las librerías: los datos y las claves no se tocan.
set -e

USUARIO=$(whoami)
cd ~/droid-e3d/backend

echo "== Librerías de Python (tarda unos minutos la primera vez)"
[ -d venv ] || python3.11 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt

if [ -f .env ]; then
    echo "== Ya hay .env: es una actualización, no se cambian claves ni datos."
else
    echo "== Configuración (.env)"
    read -s -p "Contraseña de MySQL (la de la pestaña Databases; sin comillas simples): " DB_PASS; echo
    read -p "Mail de contacto para las notificaciones: " MAIL

    # Claves nuevas, solo para este servidor (nunca se suben a GitHub)
    nueva_clave() { python -c "import secrets; print(secrets.token_urlsafe(32))"; }
    PUSH=$(python tools/generar_claves_push.py)

    cat > .env <<FIN
DB_HOST=${USUARIO}.mysql.pythonanywhere-services.com
DB_USER=${USUARIO}
DB_PASS='${DB_PASS}'
DB_NAME='${USUARIO}\$droid'
JWT_SECRET=$(nueva_clave)
FLASK_DEBUG=0

YOLO_API_KEY=$(nueva_clave)
ROBOT_API_KEY=$(nueva_clave)

$(echo "$PUSH" | grep '^VAPID_PUBLIC_KEY=')
$(echo "$PUSH" | grep '^VAPID_PRIVATE_KEY=')
VAPID_CONTACTO=mailto:${MAIL}
FIN
    chmod 600 .env   # solo vos podés leerlo

    echo "== Tablas y datos de ejemplo"
    python tools/cargar_datos_ejemplo.py
fi

echo
echo "Listo. Falta (una sola vez) crear la web app en la pestaña Web:"
echo "  Virtualenv: /home/${USUARIO}/droid-e3d/backend/venv"
echo "  WSGI:       sys.path.insert(0, \"/home/${USUARIO}/droid-e3d/backend\") y from wsgi import application"
echo "Y siempre al final: pestaña Web -> Reload ${USUARIO}.pythonanywhere.com"
