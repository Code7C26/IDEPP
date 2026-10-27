# Bitácora de DROID-E3D

> Una entrada por semana (más nueva arriba). Se genera con `/bitacora`.

## Semana 3 · desde el 19/10/2026

**Hecho**
- 19/10: Morena arma el **documento final del FAT** (11 secciones según la guía del colegio), con lo que falta marcado `[COMPLETAR]`. El índice y los pendientes están en `docs/SMAT/documentacion-final/README.md`.
- 19/10: Morena, en `SMAT-hardware`: las IPs de la cámara y del robot pasan a `servidor_ia/.env` (`config.py`), las fotos de caras y los modelos descargables dejan de subirse a GitHub (Ley 25.326) y `CONTRIBUIR.md` suma los comandos de git del día a día.
- 19/10: Issue #72 para Morena: rediseñar el logo, porque no está de acuerdo con la versión 1.
- 21/10: PR #73 (`SMAT-hardware` → `main`): el CI también revisa `servidor_ia/` y `cargar_trabajadores_ia.py` explica cómo conseguir las fotos. Se ponen al día esta bitácora y el plan.
- 21/10: **Fase 9.1**: prueba automática que recorre las 17 pantallas en celular y PC, en claro y oscuro, y con el servidor caído (78 casos). Arreglos: Empleados y Zonas quedaban en «Cargando…» sin servidor, y el botón para elegir la foto de rostro cortaba su texto en el celular. 105 pruebas de la API y 112 de punta a punta.
- 21/10: **Fase 9.2**: `docs/DEMO-LOCAL.md`, guía para la demo sin internet (IP, firewall, dónde va la IP en cada pieza, simuladores y problemas comunes). La IA ahora lee también `DROID_URL` y `YOLO_API_KEY` de `servidor_ia/.env`. El README cargaba el esquema con `<`, que en PowerShell no anda: ahora usa `cmd /c`.
- 22/10: Secciones técnicas de Toro del documento final, en Markdown y en Word con formato APA (`docs/SMAT/documentacion-final/`). Consentimientos de las fotos confirmados. Morena sube por PR el sketch del robot con sensores de línea y de distancia (#77).
- 22/10: **Fase 9.3**: PythonAnywhere gratis ya no tiene MySQL, así que la versión online pasa a **Render + Supabase** (decisión 007). El backend funciona con MySQL y con Postgres; las 105 pruebas de la API corren también contra Postgres en GitHub Actions; las fotos van a Supabase Storage; `tools/cargar_supabase.py` carga los datos de ejemplo.

**Problemas**
- El README del documento final se subió directo a `main`, sin PR. Se le recordó la regla a Morena en el PR #73.
- Las caras siguen en el historial de git aunque ya no estén en la versión actual. El repo es privado y no se reescribe el historial, porque afectaría a todo TOUCH.
- Al bajar el cambio de Morena, git borra la carpeta local `fotos_trabajadores/`: hay que copiarla antes.

**Próximos pasos**
- Fase 9: 9.3 publicar en PythonAnywhere (falta crear la cuenta); 9.4 README final.
- Documento final: Toro completa diseño, desarrollo, pruebas y capturas de GitHub; Morena, robot, IA y hardware.
- Morena: logo nuevo (#72) y prueba real con el hardware (6.5, #48).

## Semana 2 · desde el 12/10/2026

**Hecho**
- 15/10: **Preparación de la 9.3**: todo va en PythonAnywhere (se descartan Vercel y Supabase). Flask sirve la API y también la web compilada en la misma dirección, sin CORS. Hay `wsgi.py`, una carga de datos de ejemplo que cambia la contraseña `pass123` y `docs/DESPLIEGUE.md` paso a paso. 105 pruebas de la API y 34 de punta a punta.

**Problemas**
- Edge y Chrome se quedaban en «Activando…» al activar las notificaciones desde el Panel: la animación del mapa no dejaba terminar la suscripción. Se pausan las animaciones mientras tanto, con un límite de 20 s.

**Decisiones**
- `docs/decisiones/005` actualizada: todo en PythonAnywhere.

## Semana 1 · desde el 05/10/2026

**Hecho**
- Se definió la jerarquía: TOUCH (empresa madre) → SMAT (división) → DROID-E3D (producto).
- Se migró la app al repo compartido `Code7C26/TOUCH-ID` (rama `SMAT-web`).
- Plan completo reescrito (`docs/PLAN.md`): landing pública, empresa SMAT, hardware, push, reportes.
- Entorno verificado: Python, Node, MySQL (XAMPP), `gh`. Backend y frontend arrancan.
- Etiquetas `smat:*`, plantillas de Issue y PR, `CONTRIBUIR.md`.
- 06/10: **Fase 2 y 3** de la web: Tailwind, claro/oscuro, menú por rol y las tres pantallas del empleado.
- 06/10: **Empresa SMAT** completa (versión 1): 29 documentos, acuerdo de socios, finanzas, legal, FODA, pitch y guion del jurado.
- 06/10: **Fase 4** de la web: mapa de la fábrica, panel, incidencias, empleados y zonas del encargado.
- 06/10: **Fase 5**: control del robot desde la web (órdenes, parada de emergencia, ruta), video en vivo, parada automática de la máquina y su reactivación, y simulador del ESP32.
- 07/10: **Fase T**: pruebas automáticas del backend (pytest) y de la web (Playwright), corriendo solas en GitHub Actions en cada PR.
- 07/10: **Fase R** (rediseño estilo SaaS): barra lateral, avisos flotantes, paneles laterales, validación en vivo, tablas ordenables con búsqueda, tarjetas con tendencia y mini gráfico, y mapa con íconos de máquina y EPP, robot animado, recorrido numerado y detalle de cada zona.
- 07/10: **Fase 6**: foto de evidencia en cada alerta, fotos de rostro con consentimiento (Ley 25.326) que maneja el encargado o el propio empleado, `GET /rostros` para la IA, simulador de YOLO y guía de la prueba real.
- 08/10: Morena reorganiza el repo (la web pasa a `src/SMAT/`, la empresa a `docs/SMAT/`) y sube su servidor de IA (YOLO + reconocimiento facial). Se renombra a `src/SMAT/servidor_ia/` y se conecta con el backend: cada alerta llega a la web con la foto, el nombre del trabajador y la zona del robot, y detiene la máquina.
- 08/10: **Revisión general**: recorrido automático de las 14 pantallas en 5 tamaños y temas (sin errores), pruebas de robustez (el servidor ya no se cae con datos raros), la baja o el cambio de rol cortan la sesión al instante, validación de la dirección del video y arreglos de la web en celular y tablet. 76 pruebas de la API y 17 de punta a punta.
- 08/10: **Fase L**: página pública de SMAT en `/` (Inicio, Cómo funciona, Planes, Nosotros, Contacto) con los textos de la empresa, capturas reales de la app con datos ficticios, título y descripción por página, menú para celular y 4 pruebas e2e.
- 08/10: **Entregas de Classroom** (tomando como modelo KIDO y lo de TOUCH): viabilidad comercial con costos reales y fuentes, Business Model Canvas, punto de equilibrio (2 clientes por año), mercado TAM/SAM/SOM (≈ 495 industrias en la zona), «Los primeros 10» con empresas reales de Alta Gracia y Malagueño, y balance del MVP (75 %). Todo en `docs/SMAT/documentacion-comercial/` con PDF. Tareas pendientes cargadas como Issues en el tablero Kanban con su estimación (#48 a #66). Se suman `assets/SMAT` y `design/SMAT`.
- 08/10: **Fase 7** (tiempo real): banner y sonido de alertas nuevas cada 3 s, web instalable como app (PWA) y notificaciones push al celular y la PC.
- 09/10: **Fase 8**: API y página de Reportes (gráficos y ranking de cumplimiento), descargas en CSV y PDF mensual para la ART, comentarios en las alertas y página de Auditoría. 100 pruebas de la API y 34 de punta a punta.

**Problemas**
- Node.js y GitHub CLI no estaban instalados (resuelto con winget).
- El repo anterior (KIDO-bysmaft) tenía material de proyectos viejos; se dejó de usar.
- Los acentos se guardaban mal al cargar `schema.sql` desde la consola de Windows; se corrigió con `SET NAMES utf8mb4`.

**Decisiones**
- Ver `docs/decisiones/001` a `006`.

**Próximos pasos**
- Fase 7: tiempo real (alerta sonora, PWA y notificaciones push). Fase 6.5: prueba real con el hardware de Morena (`docs/integracion/PRUEBA.md`).
- Morena: revisar `docs/API.md` y el acuerdo de socios; probar el robot y el relé contra el backend.
