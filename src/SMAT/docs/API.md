# API de DROID-E3D · contrato con hardware e IA

> Para **Morena** (ESP32, relé, cámara, YOLO). Si algo de acá no te sirve o falta algo, abrí un Issue
> `smat:hardware` o `smat:ia`. **Este documento es un contrato:** si cambia, se avisa en el PR.

**URL base:** `http://<IP-de-la-PC>:5000/api` (en la demo local) · `https://<usuario>.pythonanywhere.com/api` (online)
**Formato:** JSON (`Content-Type: application/json`). Los errores siempre vienen así: `{"error": "mensaje claro"}`.

## Estado de cada endpoint

| Marca | Significa |
|---|---|
| ✅ | Ya funciona, podés probarlo hoy |
| 🔜 | Se implementa en la fase indicada; el formato ya está definido |

## Autenticación de las máquinas

Las máquinas **no usan usuario/contraseña**: mandan una clave en el header `X-API-KEY`.

| Quién | Clave (en `backend/.env`) | Para qué endpoints |
|---|---|---|
| Servidor de IA (YOLO) | `YOLO_API_KEY` | `POST /incidents`, `GET /rostros`, `GET /zones` |
| ESP32 (robot y máquinas) | `ROBOT_API_KEY` | `/robot/comando-pendiente`, `/robot/reporte`, `/zones/<id>/maquina`, `GET /zones` |

Las claves las genera el backend y **nunca se suben al repo**. Pedísela a Toro por fuera de GitHub.
Sin clave → `401`. Clave equivocada → `401`. Servidor sin clave configurada → `503`.

---

## 1. Servidor de IA (YOLO)

### ✅ `POST /incidents` · registrar una falta de EPP
Header: `X-API-KEY: <YOLO_API_KEY>`

```json
{ "tipo": "sin_casco", "zona_id": 1, "empleado_id": 3, "confianza": 0.93 }
```

| Campo | Obligatorio | Detalle |
|---|---|---|
| `tipo` | sí | `sin_casco`, `sin_guantes`, `sin_lentes` o `sin_chaleco` |
| `zona_id` | no* | id de la zona. *Alternativa: `"zona": "Zona A"` (por nombre). **Si no mandás ninguna, se usa la zona que reportó el robot** (la cámara va en el robot); si el robot nunca reportó su zona → `400` |
| `empleado_id` | no | id del empleado reconocido. Omitilo o mandá `null` si no lo identificó |
| `empleado` | no | Alternativa a `empleado_id`: el **nombre** del empleado tal como está en la web (ej. el de la carpeta de fotos de la IA). Sin importar mayúsculas. Si no hay nadie con ese nombre (o es `"Desconocido"`), la alerta se guarda igual, sin empleado |
| `confianza` | no | número de 0 a 1 (por defecto 0) |

Respuesta `201` con la incidencia creada (`id`, `timestamp`, `estado: "activa"`...) y `maquina_detenida`: `true` si **esta falta detuvo la máquina de la zona** (la zona tiene máquina y estaba activa). Errores `400`: tipo inválido, zona o empleado inexistente, confianza fuera de rango.

### ✅ `POST /incidents` con foto de evidencia
Mismo endpoint, pero `multipart/form-data` con los campos de arriba (como texto) más `imagen` (JPG o PNG, máx. **5 MB**). El JSON simple de arriba sigue funcionando.

```python
requests.post(f"{URL}/incidents", headers={"X-API-KEY": CLAVE},
              data={"tipo": "sin_casco", "zona_id": 1, "empleado_id": 3, "confianza": 0.93},
              files={"imagen": ("deteccion.jpg", jpg_en_bytes, "image/jpeg")})
```
- `empleado_id` vacío (`""`) = no se reconoció a la persona.
- La respuesta trae `imagen_url` (ej. `"/uploads/evidencias/41_a1b2c3d4.jpg"`).
- Errores: `400` si la imagen no es JPG/PNG o está vacía (no se guarda la incidencia), `413` si pesa más de 5 MB.
- El servidor revisa el contenido del archivo, no la extensión, y le pone un nombre propio.

### ✅ Servidor de IA de Morena (`src/SMAT/servidor_ia/`)
`motor_ia_robot.py` manda cada alerta a la web con `conexion_droid.py`: multipart con la foto del momento,
`empleado` = nombre de la carpeta en `fotos_trabajadores/` y sin zona (usa la del robot).
Para que la alerta quede a nombre de alguien, ese nombre tiene que existir como empleado en la web:
`python backend/tools/cargar_trabajadores_ia.py --clave-inicial <clave>` los da de alta.

### ✅ `GET /zones` · zonas y EPP obligatorio
Header: `X-API-KEY` (la de YOLO o la del robot). Sirve para saber qué EPP exigir en cada zona:
```json
{ "zonas": [ { "id": 1, "nombre": "Zona A", "maquina": "Sierra circular",
               "epp_requerido": ["casco", "lentes", "guantes"], "maquina_activa": true } ] }
```

### ✅ `GET /rostros` · fotos para el reconocimiento facial
Header: `X-API-KEY: <YOLO_API_KEY>`. Devuelve las fotos de cada empleado para entrenar/comparar.

```json
{ "rostros": [ { "empleado_id": 1, "nombre": "Juan Pérez", "fotos": ["/uploads/rostros/1_a1b2c3d4.jpg"] } ] }
```
- Solo aparecen empleados **activos** que tienen fotos, y una foto solo se puede subir con el **consentimiento** marcado (Ley 25.326).
- Las fotos las cargan el encargado (Empleados → Editar) o el propio empleado (Mi perfil); hasta 5 por persona.
- Si alguien borra su foto o lo dan de baja, desaparece de esta lista: **volvé a pedirla seguido** (ej. cada 5 minutos) y no guardes copias viejas.

### ✅ `GET /uploads/<carpeta>/<archivo>` · descargar una foto
Header: `X-API-KEY: <YOLO_API_KEY>`. Se usa con las rutas que devuelve `/rostros` (o `imagen_url`): `GET {URL}/uploads/rostros/1_a1b2c3d4.jpg`.
Las fotos **no son públicas**: sin clave ni sesión responde `401`. `404` si ya no existe.

### ✅ Video en vivo
La web muestra un stream **MJPEG** que sirve la PC de YOLO (con las cajas de detección). Morena define la URL (ej. `http://<IP-PC-YOLO>:8080/video`) y se guarda en `robot.url_video`.

---

## 2. ESP32 del robot

Header en todos: `X-API-KEY: <ROBOT_API_KEY>`. Recomendado: consultar cada **1-2 segundos**.

### ✅ `GET /robot/comando-pendiente` · ¿qué tengo que hacer?
```json
{ "comando": "iniciar", "estado": "detenido" }
```
`comando`: `iniciar` · `pausar` · `detener` · `emergencia` · `null` (nada nuevo).
`emergencia` = frenar motores YA. El comando se repite hasta que lo confirmes (ver abajo).

### ✅ `POST /robot/reporte` · contarle al backend cómo estoy
Todos los campos son opcionales; mandá los que cambiaron:
```json
{ "estado": "recorriendo", "bateria": 87, "zona_actual_id": 2, "comando_ejecutado": "iniciar" }
```
| Campo | Valores |
|---|---|
| `estado` | `detenido`, `recorriendo`, `pausado`, `emergencia` |
| `bateria` | entero 0 a 100 |
| `zona_actual_id` | id de la zona donde está (o `null`) |
| `comando_ejecutado` | el comando que acabás de cumplir; así el backend deja de repetirlo |

Respuesta: `{ "comando": ..., "estado": ... }`. **Cada reporte cuenta como "latido":** si pasan más de 10 s sin reportar, la web muestra el robot como *desconectado*.

### ✅ `GET /robot/ruta` · zonas a recorrer
Lista ordenada de zonas a visitar y cuántos segundos esperar en cada una (la define el encargado desde la web):
```json
{ "ruta": [ { "orden": 1, "zona_id": 1, "zona": "Zona A", "tiempo_espera_seg": 30 },
            { "orden": 2, "zona_id": 2, "zona": "Zona B", "tiempo_espera_seg": 30 } ] }
```
Consultala al arrancar y cada vez que recibas `iniciar`, por si el encargado la cambió.

### Cómo llega un comando al robot
1. El encargado toca **Iniciar / Pausar / EMERGENCIA** en la web (`POST /robot/comando`, ver sección 2b).
2. El backend guarda `comando_pendiente`.
3. El ESP32 lo ve en su próxima consulta, lo ejecuta y manda `comando_ejecutado`.
4. El backend borra el comando.

> La parada de emergencia de la web tiene hasta ~2 s de demora. **El robot debe tener además un botón físico de parada.**

**Después de una `emergencia`** el backend rechaza `iniciar` y `pausar` (409) hasta que el encargado envíe `detener`. Así el robot no puede volver a arrancar solo.

**Sin conexión** (más de 10 s sin reportar) el backend rechaza `iniciar` (409). Si el robot se desconecta con un `iniciar` sin tomar, esa orden se descarta cuando vuelve: nunca arranca solo. `pausar`, `detener` y `emergencia` sí se guardan y le llegan al volver. Para el ESP32 no cambia nada.

### 2b. Lo que hace la web (para que sepas qué te va a llegar)
Estos endpoints los usa el encargado con sesión (`Authorization: Bearer ...`); el ESP32 no los llama.

| Endpoint | Para qué |
|---|---|
| ✅ `GET /robot/estado` | Estado, batería, zona, comando pendiente y `conectado` (reportó hace menos de 10 s) |
| ✅ `POST /robot/comando` | `{"comando": "iniciar" \| "pausar" \| "detener" \| "emergencia"}` · 409 si es `iniciar` y el robot no está conectado |
| ✅ `PUT /robot/ruta` | `{"ruta": [{"zona_id": 1, "tiempo_espera_seg": 30}, ...]}` (el orden de la lista es el recorrido; espera de 5 a 3600 s) |
| ✅ `PUT /robot/video` | `{"url_video": "http://<IP-PC-YOLO>:8080/video"}` · texto vacío = sin video |

---

## 3. ESP32 de la máquina (relé)

### ✅ `GET /zones/<id>/maquina`
Header: `X-API-KEY: <ROBOT_API_KEY>`
```json
{ "zona_id": 2, "maquina": "Soldadora MIG", "maquina_activa": true }
```
- `maquina_activa: true` → relé cerrado, la máquina funciona.
- `maquina_activa: false` → **abrir el relé y cortar la máquina**.

Consultar cada 1-2 s. **Si no hay conexión con el backend, decidan juntos qué hace el ESP32** (recomendado: dejar la máquina como está y encender un LED de aviso).

**Cuándo cambia `maquina_activa`** (✅ ya funciona):
- `false` → cuando YOLO registra una incidencia en la zona (si la zona tiene máquina), o cuando el encargado la detiene a mano desde la web.
- `true` → solo cuando **el encargado la reactiva** desde la web (`PUT /zones/<id>/reactivar`). La IA nunca reactiva una máquina.
- Todo queda en la auditoría (la parada automática figura como hecha por el «Sistema»).

---

## 3b. Notificaciones push (solo la web; para el hardware no cambia nada)

Cuando llega una alerta por `POST /incidents`, el backend además manda una notificación push a los
encargados y al empleado detectado que la hayan activado. La respuesta a la IA es la misma y no espera
ese envío. Estas rutas las usa la web, con la sesión de la persona (`Authorization: Bearer <token>`):

| Endpoint | Para qué |
|---|---|
| ✅ `GET /push/clave` | `{"clave_publica": "..."}` para que el navegador se suscriba · `503` si faltan las claves VAPID en `backend/.env` |
| ✅ `POST /push/suscribir` | Lo que da el navegador: `{"endpoint": "https://...", "keys": {"p256dh": "...", "auth": "..."}}` → `201` |
| ✅ `POST /push/desuscribir` | `{"endpoint": "https://..."}`: ese dispositivo deja de recibir (solo si es del usuario) |
| ✅ `POST /push/probar` | Manda una notificación de prueba a los dispositivos del usuario → `{"enviadas": 1}` · `404` si no activó ninguno |

Las claves se generan una vez con `python backend/tools/generar_claves_push.py`.

## 3c. Reportes, comentarios y auditoría (solo la web)

Solo el encargado, con su sesión. El período es `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` (por defecto los
últimos 30 días contando hoy; máximo 366 días). **Cumplimiento** = días sin alertas / días del período
(la misma cuenta que ve el empleado en su inicio).

| Endpoint | Para qué |
|---|---|
| ✅ `GET /reports/diario` | `dias` (cada día, con la cantidad por tipo y el total), `por_tipo`, `por_zona`, `total`, `activas`, `resueltas`, `paradas_maquina` |
| ✅ `GET /reports/ranking` | `empleados` y `zonas`, de mejor a peor cumplimiento (`alertas`, `dias_con_alerta`, `cumplimiento` en %), y `alertas_sin_identificar` |
| ✅ `GET /reports/incidencias.csv` | Las alertas del período en CSV para Excel (separado por `;`, UTF-8 con BOM). Queda en la auditoría |
| ✅ `GET /reports/mensual.pdf?mes=AAAA-MM` | Informe mensual en PDF para la ART (por defecto el mes actual, hasta hoy). Queda en la auditoría |

Comentarios: el encargado en cualquier alerta; el empleado, solo en las suyas (si no, `403`).

| Endpoint | Para qué |
|---|---|
| ✅ `GET /incidents/<id>/comentarios` | `{"comentarios": [{id, usuario_nombre, usuario_rol, texto, created_at}]}`, del más viejo al más nuevo |
| ✅ `POST /incidents/<id>/comentarios` | `{"texto": "..."}` (1 a 500 caracteres) → `201`. Avisa por push a la otra parte y queda en la auditoría |

Cada incidencia trae además `cantidad_comentarios`.

| Endpoint | Para qué |
|---|---|
| ✅ `GET /auditoria` | Solo el encargado. Registros del más nuevo al más viejo. Filtros: `accion`, `usuario_id` (un id o `sistema`), `desde`, `hasta`, `q` (busca en el detalle), `page`, `limit` (25; máx. 100). Devuelve también `acciones` y `usuarios` para armar los filtros |

---

## 4. Datos de referencia (solo lectura, para armar tus pruebas)

Zonas de ejemplo: `1` Zona A · `2` Zona B · `3` Zona C · `4` Zona D (ver `docs/FABRICA-CLIENTE.md`).
Empleados de ejemplo: ids `1`, `3`, `4`, `5`, `6`, `7` (el `2` es la encargada). Los datos son ficticios.

Un usuario normal se loguea con `POST /login` `{ "usuario": "...", "contrasena": "..." }` → devuelve `token`
para usar como `Authorization: Bearer <token>`. Eso es para personas, no para las máquinas.

---

## 5. Probar sin hardware

Con el backend corriendo (PowerShell):

```powershell
$h = @{ "X-API-KEY" = "<tu YOLO_API_KEY>"; "Content-Type" = "application/json" }
$body = '{"tipo":"sin_casco","zona_id":1,"empleado_id":1,"confianza":0.93}'
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/incidents -Headers $h -Body $body

$r = @{ "X-API-KEY" = "<tu ROBOT_API_KEY>" }
Invoke-RestMethod -Uri http://localhost:5000/api/robot/comando-pendiente -Headers $r
Invoke-RestMethod -Uri http://localhost:5000/api/zones/1/maquina -Headers $r
```

Ejemplos de código en `docs/integracion/` (`esp32_robot.ino`, `esp32_maquina.ino`, `cliente_yolo.py`).
**Simulador del robot y las máquinas (✅ ya disponible):** `python backend/tools/simular_esp32.py --maquinas` actúa como el ESP32 del robot (recibe órdenes, recorre la ruta, reporta batería) y vigila las máquinas; sirve para probar la web y para ver el comportamiento esperado antes de programar la placa. 

**Simulador de la IA (✅ ya disponible):** `python backend/tools/simular_yolo.py` hace de servidor YOLO: lee las zonas y los rostros y cada 20 s manda una alerta con una foto de evidencia dibujada por el script (o la tuya con `--imagen foto.jpg`). Opciones: `--cada 5`, `--cantidad 3`, `--zona 2`, `--empleado 4` (`0` = no reconocido). Cada alerta detiene la máquina de la zona, como en la fábrica.

## 6. Códigos de respuesta

`200` ok · `201` creado · `400` datos inválidos · `401` falta o es incorrecta la clave/sesión ·
`403` sin permiso · `404` no existe · `409` conflicto · `413` archivo demasiado grande · `503` servidor sin configurar.
