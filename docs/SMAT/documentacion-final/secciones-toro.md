# Documento final · Secciones de Toro (borrador para pegar)

> Borrador de las partes técnicas del documento final que le tocan a Toro: **5 · Diseño**,
> **6 · Desarrollo (software)**, **7 · Pruebas** y **11 · Anexos (capturas)**. Para pasarlo al
> documento en línea (link en [`README.md`](README.md)): copiar cada sección debajo de su título y
> después aplicar el formato APA en Google Docs. Lo que falta está marcado **[COMPLETAR]**.
> Datos al 21/10/2026.

---

## 5. Diseño

### 5.1 Arquitectura general

DROID-E3D tiene cuatro partes que se comunican por la red WiFi de la planta:

| Parte | Qué hace | Tecnología | Responsable |
|---|---|---|---|
| **Robot oruga** | Recorre las zonas de la fábrica con una cámara | ESP32 | Morena |
| **Servidor de IA** | Detecta si falta el casco, los guantes, los lentes o el chaleco, y reconoce la cara del trabajador | Python, YOLO, OpenCV | Morena |
| **Backend** | Recibe las alertas, las guarda y da las órdenes al robot y a las máquinas | Python, Flask, MySQL | Toro |
| **Aplicación web** | Muestra las alertas, el mapa, el robot y los reportes al encargado y a cada empleado | React | Toro |

Así funciona el recorrido de una alerta:

1. La cámara del robot filma la zona en la que está.
2. El servidor de IA detecta una falta de equipo de protección personal (EPP) y reconoce al trabajador.
3. La IA envía la alerta al backend (`POST /api/incidents`), con la foto del momento, el tipo de falta y la confianza de la detección.
4. El backend guarda la alerta en MySQL, marca la máquina de esa zona para que se detenga y envía una notificación push al encargado y al empleado.
5. El ESP32 de la máquina consulta su estado cada 1 o 2 segundos y abre el relé. El ESP32 del robot consulta, del mismo modo, si tiene una orden pendiente.
6. El encargado ve la alerta en la web, la resuelve y vuelve a activar la máquina.

El contrato entre las partes (qué datos envía cada una y qué recibe) está documentado en
`src/SMAT/docs/API.md`. Gracias a ese documento, hardware y software pudieron avanzar en paralelo:
mientras el robot no estaba listo, el backend se probó con **simuladores** del ESP32 y de la IA.

### 5.2 Tecnologías elegidas y por qué

Cada decisión importante quedó registrada en `src/SMAT/docs/decisiones/`, con el contexto, las opciones consideradas y el motivo de la elección.

| Decisión | Elegimos | Descartamos | Motivo |
|---|---|---|---|
| 001 · Backend y base de datos | Flask + MySQL | Node + MongoDB, Firebase | El equipo ya conocía Python y MySQL. Es simple de explicar y funciona en PythonAnywhere |
| 002 · Comunicación con el ESP32 | HTTP con consulta periódica | MQTT | No necesita otro servidor (broker), anda igual en la red local y en internet, y se prueba con el navegador |
| 003 · Diseño visual | Tailwind CSS | CSS propio, librerías de componentes | Interfaz coherente en celular y PC, con modo oscuro, sin escribir CSS a mano |
| 004 · Avisos al celular | Web instalable (PWA) + notificaciones push | WebSockets, app nativa | Las alertas llegan aunque la web esté cerrada, sin publicar una app en las tiendas |
| 005 · Publicación | PythonAnywhere (API y web en el mismo lugar) | Vercel + Supabase | Gratis, una sola cuenta y un solo lugar para mantener |
| 006 · Medida de cumplimiento | Días sin alertas sobre los días del período | Alertas por persona | Se explica en una frase y es justo entre zonas que el robot visita con distinta frecuencia |

### 5.3 Base de datos

Usamos MySQL (MariaDB de XAMPP) con 9 tablas:

| Tabla | Guarda |
|---|---|
| `zonas` | Zonas de la planta, su máquina, el EPP obligatorio y si la máquina está activa |
| `usuarios` | Empleados y encargados: rol, legajo, zona y contraseña cifrada |
| `incidencias` | Cada alerta: tipo de falta, zona, empleado, confianza, foto, estado y quién la resolvió |
| `fotos_rostro` | Fotos de la cara para el reconocimiento facial (solo con consentimiento) |
| `comentarios` | Conversación entre el encargado y el empleado sobre una alerta |
| `suscripciones_push` | Dispositivos que reciben notificaciones |
| `auditoria` | Quién hizo qué y cuándo (altas, bajas, máquinas detenidas, descargas) |
| `robot` | Estado del robot: conexión, batería, zona actual y orden pendiente |
| `puntos_ruta` | Orden en que el robot recorre las zonas y cuánto espera en cada una |

### 5.4 Mapa del sitio y roles

| Quién | Pantallas |
|---|---|
| **Público** (sin cuenta) | Inicio, Cómo funciona, Planes, Nosotros, Contacto e Ingresar |
| **Empleado** (pensado para el celular) | Inicio (su zona, el EPP obligatorio y su cumplimiento), Mis alertas y Mi perfil (con sus fotos de rostro) |
| **Encargado** (celular y PC) | Panel, Incidencias, Robot, Zonas, Empleados, Reportes y Auditoría |

Cada persona ve solo lo que le corresponde: un empleado no puede entrar a las pantallas del
encargado y solo ve sus propias alertas. Esto se controla también en el backend, no solo en la web.

### 5.5 Diseño de la interfaz

- **Pensado primero para el celular:** el empleado y el encargado la usan en la planta. En el celular hay una barra de navegación abajo; en la PC, una barra lateral fija.
- **Colores con significado:** verde para «en orden», rojo para «alerta activa», naranja para «máquina detenida». El amarillo de seguridad (`#f5b800`) es el color de la marca.
- **Modo claro y oscuro** en todas las pantallas.
- **Mapa de la fábrica:** cada zona se muestra con su máquina, el EPP obligatorio, sus alertas y la posición del robot.
- **Avisos inmediatos:** cuando llega una alerta aparecen un cartel y un sonido, y llega una notificación aunque la web esté cerrada.

### 5.6 Seguridad y datos personales

- Las contraseñas se guardan **cifradas** (PBKDF2-SHA256), nunca en texto plano.
- Las sesiones usan **tokens JWT**. Si a alguien se le da de baja o se le cambia el rol, su sesión se corta al instante.
- El robot, la máquina y la IA se identifican con **claves propias** (`X-API-KEY`), distintas de las de las personas.
- Las fotos de rostro y de evidencia **no son públicas**: solo se ven con una sesión iniciada.
- Antes de subir una foto de rostro hay que **dar el consentimiento** expreso (Ley 25.326). Cada persona puede borrar sus fotos cuando quiera.
- Todas las acciones importantes quedan en la **auditoría**.
- Las descargas en CSV están protegidas para que Excel no ejecute fórmulas escondidas en los datos.

---

## 6. Desarrollo (software)

### 6.1 Forma de trabajo

- **Planificación por fases:** el trabajo se dividió en fases y tareas en `src/SMAT/docs/PLAN.md`. Cada tarea se marca cuando está terminada.
- **GitHub:** repositorio `Code7C26/TOUCH-ID` y tablero Kanban «Kanban TOUCH-ID». Cada tarea tiene un issue con su etiqueta (`smat:web`, `smat:hardware`, `smat:empresa`, `smat:profe`…). Hasta el 21/10 hubo **31 issues** de SMAT (**27 cerrados**).
- **Ramas y Pull Requests:** cada socio trabaja en su rama (`SMAT-web`, `SMAT-hardware`, `SMAT-empresa`) y los cambios entran a `main` solo con un Pull Request. Hasta el 21/10 se integraron **18 Pull Requests** y **46 commits**.
- **Pruebas automáticas en cada cambio:** GitHub Actions corre todas las pruebas antes de aceptar un Pull Request (ver sección 7). Hasta el 21/10 corrió **29 veces**.
- **Registro:** una bitácora semanal (`docs/BITACORA.md`) y las decisiones técnicas por escrito (`docs/decisiones/`).
- **Herramientas:** Visual Studio Code, Git y GitHub, XAMPP (MySQL) y **Claude Code**, un asistente de programación con inteligencia artificial que usamos para escribir y revisar código, pruebas y documentación. Cada cambio se revisó y se probó antes de integrarlo.

### 6.2 Etapas del desarrollo

| Fase | Fecha | Qué se hizo |
|---|---|---|
| 0 · Arranque | 05/10 | Entorno (Python, Node, MySQL, GitHub CLI), etiquetas, plantillas de issues y Pull Requests |
| 1 · Backend | 05/10 | API con Flask, base de datos, sesiones y contrato con el hardware (`API.md`) |
| 2 y 3 · Base de la web y empleado | 06/10 | React + Tailwind, modo oscuro, menú por rol y pantallas del empleado |
| 4 · Encargado | 06/10 | Mapa de la fábrica, panel, incidencias, empleados y zonas |
| 5 · Robot y máquinas | 06/10 | Órdenes al robot, parada de emergencia, ruta, video en vivo, parada automática de la máquina y simulador del ESP32 |
| T · Pruebas | 07/10 | Pruebas automáticas del backend y de la web, corriendo en GitHub Actions |
| R · Rediseño | 07/10 | Estilo de aplicación profesional: barra lateral, avisos flotantes, tablas ordenables y mapa con íconos |
| 6 · IA y reconocimiento facial | 07 y 08/10 | Foto de evidencia, fotos de rostro con consentimiento y conexión con el servidor de IA de Morena |
| L · Página pública | 08/10 | Página de SMAT con capturas reales y planes |
| 7 · Tiempo real | 08/10 | Cartel y sonido de alertas, web instalable y notificaciones push |
| 8 · Reportes | 09/10 | Gráficos, ranking de cumplimiento, descargas en CSV y PDF mensual para la ART, comentarios y auditoría |
| 9 · Pulido y publicación | 15 al 21/10 | Preparación para PythonAnywhere, revisión de todas las pantallas y guía de la demo local |

### 6.3 Funcionalidades principales

**Encargado** (capturas 2 a 6 del anexo):
- **Panel** con las alertas activas, la comparación con el día y la semana anterior, el mapa de la fábrica, el estado del robot y las últimas alertas.
- **Incidencias:** lista con filtros, foto de evidencia, resolución de alertas y comentarios con el empleado.
- **Robot:** iniciar, pausar, detener y parada de emergencia, ruta editable y video en vivo.
- **Zonas:** máquina, EPP obligatorio, ubicación en el mapa, y detener o reactivar la máquina.
- **Empleados:** altas, bajas, cambios de zona y fotos de rostro.
- **Reportes:** alertas por día, por tipo de EPP y por zona, y ranking de cumplimiento. Se descargan en CSV y en un PDF mensual con firmas, para la ART.
- **Auditoría:** quién hizo qué y cuándo, con filtros.

**Empleado** (capturas 7 y 8 del anexo):
- **Inicio:** estado de su zona, el EPP que tiene que usar, su porcentaje de cumplimiento y su racha de días sin alertas.
- **Mis alertas:** su historial, con la foto de cada alerta y la posibilidad de comentar.
- **Mi perfil:** sus datos, el tema de la pantalla, sus fotos de rostro (con consentimiento) y las notificaciones.

**Público** (captura 1 del anexo): página de SMAT que presenta el producto, cómo funciona, los planes y el contacto.

### 6.4 Integración con el hardware y la IA

- El servidor de IA de Morena (`src/SMAT/servidor_ia/`) se conectó con el backend mediante `conexion_droid.py`. Cada alerta llega a la web con la foto, el nombre del trabajador reconocido y la zona donde está el robot, y detiene la máquina de esa zona.
- Las direcciones de la cámara, del robot y del backend se configuran en un archivo `.env`. Así, si cambia la red, no hace falta tocar el código.
- Para trabajar sin el hardware armamos dos simuladores: `simular_esp32.py` (un robot que recorre las zonas y las máquinas) y `simular_yolo.py` (envía alertas con foto). Con ellos se puede hacer la demo completa aunque falte una pieza.
- **[COMPLETAR]** Resultado de la prueba real con el robot, la cámara y la máquina (tarea 6.5, `docs/integracion/PRUEBA.md`).

### 6.5 Publicación

- **Demo en la red local:** la notebook hace de servidor y los celulares, el robot y la IA se conectan por WiFi. La guía paso a paso (IP, firewall, configuración de cada pieza y problemas comunes) está en `src/SMAT/docs/DEMO-LOCAL.md`.
- **Versión en internet:** PythonAnywhere, con la API y la web en la misma dirección (`docs/DESPLIEGUE.md`). **[COMPLETAR]** Dirección final cuando se publique.

---

## 7. Pruebas

### 7.1 Pruebas automáticas

El proyecto tiene **217 pruebas automáticas** que corren solas en GitHub Actions cada vez que se propone un cambio. Si alguna falla, el cambio no se integra.

| Tipo | Cantidad | Herramienta | Qué prueban |
|---|---|---|---|
| **De la API** (backend) | 105 | pytest | Sesiones y roles, alertas, fotos y consentimiento, robot y máquinas, reportes, comentarios, auditoría, notificaciones, conexión con la IA y robustez |
| **De punta a punta** (navegador real) | 112 | Playwright | Recorridos completos como lo haría una persona: entrar, ver y resolver alertas, manejar el robot, reportes, web instalable, notificaciones y la revisión visual |

Las pruebas usan **bases de datos propias** (`robot_db_test` y `robot_db_e2e`): nunca tocan los datos reales.

### 7.2 Revisión de todas las pantallas (tarea 9.1)

Una prueba recorre automáticamente las **17 pantallas** en **celular (360 px) y PC**, en **modo claro y oscuro**: son 68 combinaciones. En cada una controla que:
- no haya errores de la página,
- no aparezca scroll horizontal,
- no quede un «Cargando…» trabado,
- el tema se aplique bien,
- no haya imágenes rotas.

Además, revisa que cada pantalla **avise si el servidor no responde**, en lugar de quedar en blanco (10 casos más).

### 7.3 Pruebas de seguridad y robustez

- Datos raros o mal formados (textos enormes, tipos equivocados, campos vacíos) no hacen caer el servidor: responden con un error claro.
- Un empleado no puede ver alertas de otro ni entrar a las pantallas del encargado.
- No se puede leer ningún archivo fuera de la carpeta de la web.
- Sin la clave correcta, nadie puede hacerse pasar por el robot o por la IA.

### 7.4 Errores encontrados y cómo los corregimos

| Error | Cómo se detectó | Solución |
|---|---|---|
| Los acentos se guardaban mal al cargar la base desde la consola de Windows | Al ver los nombres en la web | `SET NAMES utf8mb4` en `schema.sql` |
| Edge y Chrome se quedaban en «Activando…» al activar las notificaciones desde el Panel | Prueba de notificaciones push | La animación del mapa no dejaba terminar la suscripción: se pausa mientras tanto, con un límite de 20 s |
| Empleados y Zonas quedaban en «Cargando…» si el servidor no respondía | Revisión automática con el servidor caído | Se muestra el error y el mensaje correcto |
| En el celular, el botón para elegir la foto cortaba su texto | Capturas de la revisión visual | Botón propio que muestra el nombre del archivo |
| En la página pública, una imagen del celular se veía como una barra negra hasta cargar | Capturas de la revisión visual | Se reserva el tamaño de la imagen antes de cargarla |
| El comando para cargar la base no andaba en PowerShell | Al escribir la guía de la demo | Se usa `cmd /c` |
| Si un dato del `.env` de la IA quedaba vacío, se perdía la dirección del backend | Al revisar la configuración | Se usa el valor por defecto |

### 7.5 Prueba real con el hardware

**[COMPLETAR]** con la planilla de `docs/integracion/PRUEBA.md` el día de la prueba: robot (conexión,
órdenes, parada de emergencia), máquina (corte y reactivación del relé) y cámara con IA (detección,
reconocimiento, alerta con foto y parada de la máquina). Fecha, participantes y resultados.

### 7.6 Pruebas con usuarios

**[COMPLETAR]** Testing cruzado con otro equipo y devolución de usuarios (qué les resultó claro, qué cambiarían).

---

## 11. Anexos · Capturas

### 11.1 Capturas de la aplicación

Están en la carpeta `capturas/`, junto a este archivo. Se tomaron con **datos de prueba**: los empleados son ficticios y no aparecen fotos de personas reales.

| N.º | Archivo | Qué muestra |
|---|---|---|
| 1 | `01-pagina-publica.png` | Página pública de SMAT (PC) |
| 2 | `02-panel-encargado.png` | Panel del encargado: indicadores, mapa de la fábrica, robot y últimas alertas |
| 3 | `03-incidencias.png` | Lista de incidencias con filtros |
| 4 | `04-control-robot.png` | Control del robot: órdenes, ruta y video |
| 5 | `05-reportes.png` | Reportes: gráficos y ranking de cumplimiento |
| 6 | `06-zonas-modo-oscuro.png` | Zonas y máquinas, en modo oscuro |
| 7 | `07-empleado-celular.png` | Inicio del empleado en el celular |
| 8 | `08-mis-alertas-celular-oscuro.png` | Mis alertas en el celular, en modo oscuro |

### 11.2 Capturas de GitHub

**[COMPLETAR]** Hay que sacarlas a mano desde el navegador (con la sesión de GitHub iniciada):

| Qué | Dónde |
|---|---|
| Tablero Kanban con las tareas | https://github.com/orgs/Code7C26/projects/36 |
| Pull Requests integrados | https://github.com/Code7C26/TOUCH-ID/pulls?q=is%3Apr+is%3Amerged+head%3ASMAT |
| Pruebas automáticas en verde | https://github.com/Code7C26/TOUCH-ID/actions/workflows/smat-ci.yml |
| Issues de SMAT | https://github.com/Code7C26/TOUCH-ID/issues?q=label%3Asmat%3Aweb |
| Historial de commits | https://github.com/Code7C26/TOUCH-ID/commits/main/src/SMAT |
