# DROID-E3D · by IDEPP

> **IDEPP** es una empresa con dos productos: TOUCH-ID y **DROID-E3D**. DROID-E3D es un robot de inspección que usa IA (YOLO)
> para detectar si los empleados de una fábrica usan su equipo de protección personal (EPP), y esta aplicación
> web donde se ven y gestionan las alertas y se controla el robot.

**Documentos:** [Plan de trabajo](docs/PLAN.md) · [API para hardware e IA](docs/API.md) · [Cómo contribuir](CONTRIBUIR.md) ·
[Decisiones técnicas](docs/decisiones/) · [Bitácora](docs/BITACORA.md) · [Fábrica cliente](docs/FABRICA-CLIENTE.md)

## Cómo funciona

```
Cámara → servidor YOLO ──POST /api/incidents──▶ Backend Flask ──▶ MySQL ──▶ Web (React)
               │                                     ▲
               └──▶ robot: se detiene y da la alarma  └── el ESP32 del robot consulta por HTTP cada 1-2 s
```

Ante una falta, el robot se detiene en la zona, muestra el signo de peligro y hace sonar la alarma. Las máquinas de la
fábrica no se tocan ([decisión 010](docs/decisiones/010-sin-corte-de-maquina.md)).

- **Empleado:** ve el estado de su zona, el EPP que tiene que usar, su cumplimiento y sus alertas (con foto), y puede comentarlas.
- **Encargado:** ve y resuelve todas las alertas, controla el robot (iniciar, pausar, parada de emergencia, ruta, video), gestiona zonas y empleados, y tiene reportes (CSV y PDF para la ART) y auditoría.
- **Avisos:** cartel y sonido en la web, y notificaciones push al celular o la PC aunque la web esté cerrada.
- **Para todos:** la web está en español y en inglés (botón ES/EN), y el botón «?» abre una guía paso a paso de cada pantalla.
  La página pública tiene un asistente de preguntas frecuentes y el juego «Patrulla DROID-E3D», con ranking.
- **Programas (la IA y el ESP32 del robot):** no tienen usuario; se identifican con una clave en el header `X-API-KEY`.

## Capturas

Con datos de prueba (empleados ficticios, sin fotos de personas reales). Se vuelven a sacar con
`tests/e2e/test_capturas_documento.py` (cómo, al principio del archivo).

| Panel del encargado (PC) | Inicio del empleado (celular) |
|---|---|
| ![Panel del encargado: indicadores, mapa de la fábrica, robot y zonas con más alertas](../../docs/SMAT/documentacion-final/capturas/02-panel-encargado.png) | ![Inicio del empleado en el celular](../../docs/SMAT/documentacion-final/capturas/07-empleado-celular.png) |

| Control del robot | Reportes |
|---|---|
| ![Control del robot: video, órdenes, ruta y su zona en el mapa](../../docs/SMAT/documentacion-final/capturas/04-control-robot.png) | ![Reportes: gráficos y ranking de cumplimiento](../../docs/SMAT/documentacion-final/capturas/05-reportes.png) |

Más capturas en [`docs/SMAT/documentacion-final/capturas/`](../../docs/SMAT/documentacion-final/capturas/).

## Demo

- **En internet:** https://droid-e3d.onrender.com (Render + Supabase, plan gratis). Si nadie la visitó en los últimos 15 minutos, la primera carga tarda cerca de 1 minuto: abrirla un rato antes de mostrarla. Usuarios de ejemplo: `maria` (encargada) y `juan` (empleado); la contraseña se la pasa Tiziano (no está en el repo).
- **En la red local** (feria, aula o jurado, sin internet): [`docs/DEMO-LOCAL.md`](docs/DEMO-LOCAL.md).
- **Guion para el jurado** (quién habla, demo paso a paso, plan B y preguntas posibles): [`guion-jurado.md`](../../docs/SMAT/EMPRESA-SMAT/09-presentaciones/guion-jurado.md).
- **Usuarios:** `maria` (encargada) y `juan` (empleado), contraseña `pass123` (ver la tabla de abajo).

## Estado técnico (20/11/2026)

Pruebas automáticas en el repo: **124 de la API** (pytest), que corren contra MySQL y contra Postgres, y **137 de punta a punta** en el navegador (Playwright), entre ellas el recorrido de las 18 pantallas en celular y PC, en claro y oscuro. Corren solas en GitHub Actions en cada PR.

| Área | Estado |
|---|---|
| Backend: login con roles, zonas, empleados, incidencias (filtros, orden, búsqueda, estadísticas), auditoría | ✅ Funciona |
| Backend: endpoints para YOLO y ESP32 (`/incidents`, `/rostros`, `/robot/*`) | ✅ Funciona; falta probarlo con el hardware real (6.5) |
| Backend: foto de evidencia en las alertas y fotos de rostro con consentimiento (Ley 25.326) | ✅ Funciona |
| Frontend: diseño estilo SaaS (claro/oscuro, celular y PC), pantallas del empleado y del encargado | ✅ Funciona |
| Frontend: control del robot con video en vivo, mapa con recorrido, detalle de cada zona | ✅ Funciona con el simulador |
| Renders 3D y juego (`/`, `/como-funciona`, `/juego`): archivos de Claude en `frontend/public/robot3d`, decisión 008. El juego pide el nombre y guarda un ranking | ✅ Funciona; son simulaciones, no están conectadas al robot real |
| Página pública de IDEPP (`/`, `/como-funciona`, `/juego`, `/planes`, `/nosotros`, `/contacto`) | ✅ Funciona; mail y WhatsApp de contacto en `frontend/.env` |
| Español e inglés, guía interactiva y asistente de preguntas frecuentes (Etapa 5) | ✅ Funciona |
| Tiempo real: cartel y sonido, web instalable (PWA), notificaciones push | ✅ Funciona (push e instalación en el celular solo con https) |
| Reportes con gráficos y ranking, CSV, PDF mensual, comentarios, auditoría | ✅ Funciona |
| Servidor de IA de Morena (`servidor_ia/`) conectado con la web | ✅ Conectado; falta la prueba real con la cámara y el robot |
| Publicación en internet (Render + Supabase) | ✅ Publicada el 25/11 en https://droid-e3d.onrender.com, con las fotos en Supabase Storage (probado el 26/11: se suben, se ven y siguen ahí después de reiniciar) |
| Hardware (robot y cámara) | Sketch del robot de Morena en `servidor_ia/robot_droid/`: un WALL-E con orugas y ESP32-S3, con pruebas por pieza en `servidor_ia/walle_*`. El 15/11 se probó con todo junto: ante una falta, frena, muestra el signo de peligro y suena la alarma. La conexión con la web del PR borrador #96 es para el robot anterior y hay que adaptarla; falta la prueba con la web (6.5). Sin hardware: `backend/tools/simular_esp32.py` y `backend/tools/simular_yolo.py` |

El detalle tarea por tarea está en [`docs/PLAN.md`](docs/PLAN.md) y los documentos de la empresa y el reporte de avance en [`docs/SMAT/`](../../docs/SMAT/) (en la raíz del repo).

## Estructura

```
src/SMAT/
├── backend/            Flask + MySQL → puerto 5000
│   ├── app.py  config.py  models.py
│   ├── routes/         auth · incidents · zones · users · robot · rostros · uploads · push · reports · comentarios · auditoria
│   ├── utils/          decoradores.py (sesión, rol, clave de API) · auditoria.py
│   ├── tools/          simuladores (ESP32 e IA), datos de ejemplo, claves push, carga de trabajadores
│   ├── tests/          pruebas de la API (pytest)
│   └── database/       schema.sql (tablas + datos de ejemplo)
├── frontend/           React + Vite → puerto 5173 (compilada, la sirve Flask en el 5000)
│   └── src/            api/client.js (todas las llamadas al backend) · pages/ · components/
├── servidor_ia/        IA de Morena: YOLO + reconocimiento facial → manda las alertas a la web
├── tests/e2e/          pruebas de punta a punta (Playwright) · correr_e2e.py las arranca
└── docs/               PLAN · API · DEMO-LOCAL · DESPLIEGUE · FABRICA-CLIENTE · BITACORA · decisiones/ · integracion/
```

## Cómo usarlo (Windows, PowerShell)

Necesitás: Python 3.11, Node.js LTS y MySQL (alcanza con XAMPP).

### 1. Base de datos
Iniciá **MySQL** desde el panel de XAMPP y cargá el esquema con los datos de ejemplo:
```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root < backend\database\schema.sql"   # PowerShell no acepta el < solo
```
Para empezar de cero (borra los datos): `C:\xampp\mysql\bin\mysql.exe -u root -e "DROP DATABASE robot_db;"` y volver a cargar el esquema.

### 2. Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```
Editá `backend\.env`: poné `DB_PASS` (en XAMPP suele estar vacía), un `JWT_SECRET` propio y las dos claves de los programas (IA y robot).
Para generar una clave:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(24))"
```
`YOLO_API_KEY` es para el servidor de IA y `ROBOT_API_KEY` para los ESP32. **El `.env` nunca se sube al repo.**
Para las notificaciones push (opcional), generá las claves VAPID una sola vez y pegá las dos líneas en el `.env`:
```powershell
python tools\generar_claves_push.py
```
```powershell
python app.py
```
Probá: http://localhost:5000/api/health

### 3. Frontend (otra terminal)
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
Abrí: http://localhost:5173 . Para entrar desde el celular, poné la IP de tu PC en `frontend\.env` (`VITE_API_URL=http://<IP>:5000/api`) y permití el puerto 5000 en el Firewall de Windows.

**Versión compilada (la misma que se publica):** `npm run build` y abrí http://localhost:5000 (la sirve Flask).
**Demo en la red local** (feria, aula o jurado, sin internet): [`docs/DEMO-LOCAL.md`](docs/DEMO-LOCAL.md).

**Publicar en internet:** Render (Flask) + Supabase (base Postgres y fotos), paso a paso en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

### Usuarios de prueba (contraseña `pass123`)
| Usuario | Rol | Zona |
|---|---|---|
| `maria` | encargado | — |
| `juan`, `lucia` | empleado | Zona A |
| `carlos`, `ana` | empleado | Zona B |
| `pedro` | empleado | Zona C |
| `sofia` | empleado | Zona D |

### Probar el robot sin hardware
```powershell
cd backend
venv\Scripts\activate
python tools\demo_en_vivo.py    # robot simulado + una alerta ficticia con foto cada 30 s
```
Agrega alertas ficticias en la base local. Para solo el robot, sin alertas: `python tools\simular_esp32.py --velocidad 3`.

Con el backend y la web andando, entrá como `maria` a **Robot** y tocá **Iniciar**: el robot simulado recorre las zonas, reporta su batería y obedece pausar, detener y la parada de emergencia.

### Probar la integración con la IA sin hardware
```powershell
$h = @{ "X-API-KEY" = "<tu YOLO_API_KEY>"; "Content-Type" = "application/json" }
$body = '{"tipo":"sin_casco","zona_id":1,"empleado_id":1,"confianza":0.93}'
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/incidents -Headers $h -Body $body
```
Después entrá como `maria` (o como `juan`) y la alerta aparece en la lista. Más ejemplos en [`docs/API.md`](docs/API.md) y [`docs/integracion/`](docs/integracion/).

## Pruebas automáticas

```powershell
cd C:\Users\tomas\Fat\TOUCH-ID\src\SMAT
backend\venv\Scripts\activate
pip install -r backend\requirements-dev.txt      # una sola vez

python -m pytest backend\tests        # 124 pruebas de la API (~2 min), usan la base robot_db_test
python tests\correr_e2e.py            # 137 pruebas con navegador real (~10 min), usan robot_db_e2e
```
Las pruebas **nunca tocan la base de desarrollo** (`robot_db`). Las de punta a punta levantan su propio backend (puerto 5001) y su propia web (5174), y prueban también el robot con el ESP32 simulado.
En GitHub corren solas en cada Pull Request (`.github/workflows/smat-ci.yml`): si algo se rompe, el PR muestra una cruz roja.

## API (resumen)

Todas las rutas llevan el prefijo `/api`. Contrato completo en [`docs/API.md`](docs/API.md).

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/login` · GET `/me` | personas | Iniciar sesión y ver el propio perfil |
| GET | `/incidents` | personas | Alertas (el empleado ve solo las suyas); filtros y paginado |
| POST | `/incidents` | YOLO | Registrar una falta de EPP |
| PUT | `/incidents/:id/resolver` | encargado | Marcar una alerta como resuelta |
| GET | `/stats` | encargado | Estadísticas del panel |
| GET/POST/PUT/DELETE | `/zones`, `/users` | encargado (lectura de zonas: todos) | Gestión de zonas y empleados |
| GET/POST/PUT | `/robot/estado`, `/robot/comando`, `/robot/ruta`, `/robot/video` | encargado | Control del robot |
| GET/POST | `/robot/comando-pendiente`, `/robot/reporte` | ESP32 del robot | Recibir órdenes y reportar estado |
| GET | `/rostros` | YOLO | Fotos de rostro (con consentimiento) para reconocer a cada empleado |
| GET/POST/DELETE | `/users/:id/rostros` | encargado o el propio empleado | Ver, subir y borrar fotos de rostro |
| GET | `/uploads/:carpeta/:archivo` | personas o YOLO | Descargar una foto (nunca es pública) |
| GET/POST | `/incidents/:id/comentarios` | encargado y el empleado de la alerta | Conversar sobre una alerta |
| GET | `/reports/diario`, `/reports/ranking` | encargado | Datos de la página Reportes |
| GET | `/reports/incidencias.csv`, `/reports/mensual.pdf` | encargado | Descargas para Excel y para la ART |
| GET | `/auditoria` | encargado | Quién hizo qué y cuándo |
| GET/POST | `/push/clave`, `/push/suscribir`, `/push/desuscribir`, `/push/probar` | personas | Notificaciones push |

## Seguridad
- Contraseñas guardadas con hash (pbkdf2-sha256), nunca en texto.
- El rol se valida **en el backend**, no solo en la web.
- Los programas usan claves distintas por función; si falta o es incorrecta, la respuesta es `401`.
- Las fotos de rostro solo se guardan con consentimiento del empleado (Ley 25.326); él mismo puede borrarlas desde su perfil y se borran al darlo de baja. Ninguna foto es pública: se piden con sesión o con la clave de la IA.
