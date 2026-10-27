# Publicar DROID-E3D en internet (Render + Supabase)

La versión de internet usa dos servicios gratis (decisión `decisiones/007-render-y-supabase.md`):

| Servicio | Qué tiene | Dirección |
|---|---|---|
| **Supabase** | La base de datos (Postgres) y las fotos (Storage, privado) | `https://xxxx.supabase.co` |
| **Render** | Flask, que sirve la API y la web compilada | `https://droid-e3d.onrender.com` (o el nombre que elijas) |

En la PC todo sigue igual (MySQL de XAMPP). El backend usa Postgres solo cuando existe la variable `DATABASE_URL`.

> Se publican solo los **datos de ejemplo** (ficticios). No subas fotos de caras sin el consentimiento firmado
> de cada persona (Ley 25.326).

---

## 1. Supabase: crear el proyecto (una sola vez)

1. Entrá a https://supabase.com y tocá **Start your project**. Podés entrar con la cuenta de GitHub.
2. **New project**:
   - *Name:* `droid-e3d`
   - *Database password:* tocá **Generate a password** y **guardala** (la vas a necesitar en el paso 2).
   - *Region:* **South America (São Paulo)**, la más cercana.
   - Tocá **Create new project** y esperá 1 o 2 minutos.
3. Arriba, botón **Connect** → pestaña **Connection string** → *Method:* **Session pooler**. Copiá la dirección:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
   Cambiá `[YOUR-PASSWORD]` por la contraseña del punto 2. Esa es la **DATABASE_URL**.
   > Tiene que ser la del **Session pooler** (puerto 5432). La *Direct connection* no anda desde Render
   > (usa IPv6) y la del *Transaction pooler* (6543) no conviene para un servidor que queda prendido.
4. Menú de la izquierda → **Project Settings** → **Data API**: copiá la **Project URL** (`https://xxxx.supabase.co`).
   Esa es la **SUPABASE_URL**.
5. **Project Settings** → **API Keys** → sección *Secret keys*: copiá la clave que empieza con `sb_secret_`.
   Esa es la **SUPABASE_SECRET_KEY**. Es como una contraseña de administrador: **nunca va al repo ni a la web**.

## 2. Cargar los datos de ejemplo (desde tu PC, una sola vez)

Con **MySQL de XAMPP prendido** (de ahí salen los datos de ejemplo), en PowerShell:

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\backend
venv\Scripts\activate
pip install -r requirements.txt
python tools\cargar_supabase.py
```

Te pide la **DATABASE_URL** del paso 1 (no se ve mientras la pegás) y una **contraseña nueva** para los usuarios de
ejemplo (`maria`, `juan`...). La de siempre, `pass123`, está publicada en el README, y en internet cualquiera podría
usarla. El script crea las tablas, copia los datos y activa la seguridad de Supabase (RLS). Si lo corrés dos veces,
la segunda no hace nada.

## 3. Render: publicar la web (una sola vez)

1. Entrá a https://render.com → **Get Started** → **GitHub**, y dale acceso al repo `Code7C26/TOUCH-ID`.
   > El repo es privado y es de la organización **Code7C26**. Si Render no lo muestra, un administrador de la
   > organización tiene que aprobar la app de Render (GitHub → *Settings* → *Applications*, o el pedido que
   > aparece al conectar).
2. **New** → **Web Service** → elegí `Code7C26/TOUCH-ID` y completá:

   | Campo | Valor |
   |---|---|
   | Name | `droid-e3d` (queda `https://droid-e3d.onrender.com`) |
   | Branch | `main` |
   | Root Directory | `src/SMAT` |
   | Runtime / Language | `Python 3` |
   | Build Command | `pip install -r backend/requirements.txt && npm ci --prefix frontend && npm run build --prefix frontend` |
   | Start Command | `cd backend && gunicorn wsgi:application --workers 1 --threads 8 --timeout 120 --bind 0.0.0.0:$PORT` |
   | Instance Type | **Free** |

3. **Environment Variables** → **Add from .env** y pegá esto, con tus datos (las claves se generan en tu PC con
   `python -c "import secrets; print(secrets.token_urlsafe(32))"` y `python tools\generar_claves_push.py`):
   ```ini
   PYTHON_VERSION=3.11.9
   NODE_VERSION=22.12.0
   TZ=America/Argentina/Buenos_Aires
   FLASK_DEBUG=0
   DATABASE_URL=la del paso 1.3
   SUPABASE_URL=la del paso 1.4
   SUPABASE_SECRET_KEY=la del paso 1.5
   JWT_SECRET=una clave generada
   YOLO_API_KEY=otra clave generada
   ROBOT_API_KEY=otra clave generada
   VAPID_PUBLIC_KEY=la que imprime generar_claves_push.py
   VAPID_PRIVATE_KEY=la que imprime generar_claves_push.py
   VAPID_CONTACTO=mailto:un-mail-de-contacto@ejemplo.com
   ```
   `TZ` hace que las horas de las alertas sean las de Argentina. Opcionales, para la página Contacto:
   `VITE_CONTACTO_EMAIL` y `VITE_CONTACTO_WHATSAPP`.
4. **Advanced** → *Health Check Path:* `/api/health`.
5. **Deploy Web Service**. La primera vez tarda unos 5 minutos (instala Python y Node, y compila la web).
   Al arrancar, la app crea el lugar para las fotos en Supabase Storage (un *bucket* privado `droid-e3d`).

## 4. Probar

- https://droid-e3d.onrender.com → la página pública de DROID-E3D.
- https://droid-e3d.onrender.com/api/health → `{"status": "ok", ...}`.
- **Ingresar** con `maria` y la contraseña que elegiste en el paso 2.
- Si algo falla: en Render, pestaña **Logs** (el error aparece al final).

## 5. Actualizar después de un cambio

Nada a mano: cada vez que se mergea un Pull Request a `main` que cambia `src/SMAT/`, Render compila y publica solo
(pestaña **Events** para ver cómo va). Las tablas nuevas se crean solas al arrancar.

## 6. Conectar el robot y la IA

- Dirección del backend: `https://droid-e3d.onrender.com/api` (el resto es igual a `API.md`).
  En el servidor de IA va en `servidor_ia/.env` (`DROID_URL`), junto con la `YOLO_API_KEY` de Render.
- Es `https`: el ESP32 necesita `WiFiClientSecure` para conectarse. Para la feria conviene la demo local
  (`docs/DEMO-LOCAL.md`).
- El **video en vivo** de una cámara de la red local (`http://...`) no se ve desde la versión online
  (https): la página lo avisa. Se ve en la demo local.

## 7. Límites del plan gratis

- **Render se duerme** a los 15 minutos sin visitas: la primera visita después tarda alrededor de 1 minuto en
  responder. **Antes de mostrarla, abrila unos minutos antes.**
- **Supabase pausa el proyecto** si no se usa durante una semana. Se reactiva desde su panel (**Restore project**)
  y los datos no se pierden.
- Las fotos van a Supabase Storage (1 GB gratis), porque el disco de Render se borra cada vez que se duerme.

---

## Ver la versión compilada en tu PC (sin publicar nada)

Es lo mismo que va a quedar online, servido por el Flask de tu PC:

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT\frontend
npm run build
```

Con el backend andando, abrí **http://localhost:5000**. Desde el celular, en la misma WiFi:
`http://IP-DE-LA-PC:5000` (la IP la muestra `ipconfig`). Ahí la app funciona, pero sin instalarse ni
notificaciones, porque el celular solo las permite con https.

---

## Alternativa: PythonAnywhere (necesita el plan pago)

Desde 2026, PythonAnywhere ya no da MySQL ni conexiones a bases externas en el plan gratis. Con el plan pago
(*Hacker*, USD 5 por mes) se puede usar MySQL como en la PC:

1. **Databases:** contraseña de MySQL → **Initialize MySQL**, y crear la base `droid`.
2. En la PC: `npm run build` en `frontend` y `python backend\tools\armar_paquete.py` (crea `droid-e3d.tgz`).
3. **Files:** subir `droid-e3d.tgz` a `/home/USUARIO/`. **Consoles → Bash:**
   ```bash
   tar -xzf droid-e3d.tgz && rm droid-e3d.tgz
   bash ~/droid-e3d/backend/tools/instalar_pythonanywhere.sh
   ```
4. **Web → Add a new web app → Manual configuration → Python 3.11**, con el Virtualenv y el WSGI que muestra
   el script al terminar. **Force HTTPS** y **Reload**.
