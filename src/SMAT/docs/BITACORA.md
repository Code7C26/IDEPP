# Bitácora de DROID-E3D

> Una entrada por semana (más nueva arriba). Se genera con `/bitacora`.

## Semana 8 · desde el 23/11/2026

**Hecho**
- 24/11: **La documentación dice lo que controla el producto hoy:** casco, chaleco y lentes (decisión del 17/11). Se corrigieron la misión, la propuesta de valor, los dos Canvas, el pitch, la viabilidad, el mercado, el Match, el manual de usuario y el documento final. Donde se nombraba un relé (era del corte de máquina) ahora dice ESP32-S3.
- 24/11: Video de IDEPP en inglés y en castellano (estilo cámara de IA, ≈1 min): la animación está lista; faltan las voces de los cinco.

**Pendiente**
- La web y el juego todavía aceptan «sin guantes»: Tiziano decide si lo saca.

## Semana 7 · desde el 16/11/2026

**Hecho**
- 17/11: **La IA controla tres elementos:** casco, chaleco y lentes. Se sacan los guantes y el barbijo. Se prepararon las herramientas para sacar fotos con la cámara del robot, marcarlas y reentrenar el modelo (`servidor_ia/entrenamiento/`).
- 18/11: **La web deja el corte de máquina** (decisión 010): sin parada automática, sin botones para detener o reactivar, sin el endpoint del ESP32 de la máquina y sin «paradas de máquina» en los reportes (ahora, zonas con alertas). Cada alerta de la IA queda en la auditoría. Los textos públicos dicen que el robot tiene orugas y da la alarma en la zona.
- 20/11: **Juego para mostrar** (Patrulla DROID-E3D): pide el nombre del jugador, tiene menú con pestañas (Jugar, Ranking y Cómo se juega) y guarda los 10 mejores puntajes por modo y dificultad en el navegador. A la gente le puede faltar el casco, los guantes, los lentes o el chaleco; suma racha de faltas seguidas, cuenta regresiva y pausa sola al cambiar de pestaña. Como el robot real, ya no frena la máquina. Desde ahora el juego se edita en la web y no se vuelve a copiar de Claude.
- 20/11: **Etapa 5 de la consigna** (#101): la web es **bilingüe** (botón ES/EN en la página pública y en la app, que se recuerda), tiene una **guía interactiva** que recorre cada página con el botón «?» y un **asistente de preguntas frecuentes** en la página pública (precios, qué detecta, la alarma, las fotos y la demo), sin librerías ni internet.
- 20/11: **Cierre de pendientes:** los renders ya no muestran que el robot para la máquina (`copiar_renders.py` lo corrige al copiarlos y una prueba lo controla); en el celular, el nombre del logo ya no se parte con los botones de idioma y guía (la revisión automática lo controla); capturas nuevas de la app con el diseño actual; las secciones de Tiziano del documento final, el README y el plan quedan al 20/11.
- 20/11: Una prueba con 3D fallaba de a ratos en esta computadora, también en `main`: con el 3D por software, a veces la página nunca quedaba medio segundo sin pedidos. Las pruebas con 3D ya no esperan eso.

**Problemas**
- Al borrar una carpeta de trabajo de git con `node_modules` enlazado, se vació el `node_modules` de la carpeta principal. Se recuperó con `npm ci`.

## Semana 6 · desde el 09/11/2026

**Hecho**
- 10/11: La empresa pasa a ser **IDEPP**, con dos productos: Touch ID y DROID-E3D. Morena actualiza la web, los documentos, el acuerdo de socios y los logos (PR #104). El repositorio pasa a llamarse `Code7C26/IDEPP`.
- 11/11: Se completa el cambio (decisión 009): el informe PDF mensual firma «by IDEPP», `copiar_renders.py` repite los nombres nuevos al volver a copiar los renders, se saca «oruga» de los documentos y se regeneran el canvas, los PDF y el Word.
- 12/11: Tiziano suma el Match Tecnológico, pasa los precios y costos a pesos (noviembre de 2026), cambia «Toro» por «Tiziano» en la documentación y revisa el repo. Morena suma el FODA del equipo con la reflexión final, el mini pitch, la versión estable del MVP y el avance del proyecto (de KIDO a DROID-E3D).
- 14/11: Morena retoma el hardware y arma el plan de conexiones. Se suma un modo **a control remoto** para la presentación: el joystick de PlayStation 3 no es compatible con el Bluetooth del ESP32-S3, así que se hace un joystick en una página para el celular. Para la venta, el robot sigue recorriendo solo la ruta cargada en la web; en la presentación vamos a mostrar que se puede de las dos formas.
- 15/11: **Primera prueba con todo junto**: pantalla, alarma, joystick en el celular, cámara e IA. Cuando la IA ve a alguien sin casco, el robot frena, muestra el signo de peligro y suena 10 segundos. Se arregla que la alerta tardaba hasta 4 s (ahora 0,1 s), que la cámara se recalentaba (máximo 5 fotos por segundo) y que la IA guardaba una sola falta (ahora cada una). Se suma un programa para sacar fotos y reentrenar el modelo.
- 15/11: Documentación: actas de las reuniones del 10/08, 26/08, 21/10 y 05/11 (#146); el acuerdo de socios suma el fondo común del 10 %; se saca de cuatro documentos que los socios son menores de edad (#145). En el documento final: portada con IDEPP y su logo, la parte de hardware e IA (sección 6) y la prueba con el hardware (sección 7).

**Problemas**
- La computadora no reconocía la placa del robot: un cable de tierra estaba en el pin 19, que usa el USB.
- La pantalla se prendía sin dibujar (dos cables cruzados) y el parlante no sonaba: el pin de 5V de esta placa no da energía, así que el amplificador pasó a 3,3V. Por lo mismo, los servos esperan la batería.
- La cámara ESP32-CAM se recalienta, y el modelo de IA solo detecta bien el casco (40 a 60 % de confianza).
- La notebook de Morena tiene 4 GB de RAM: con Chrome abierto, la IA se tilda.

**Próximos pasos**
- 17/11: sacar las fotos para reentrenar el modelo (barbijo y lentes, sí o sí). Con el profesor: la batería y las ruedas.
- Con Tiziano: publicar la web, la clave para que la IA guarde las faltas en la web y sumar «sin barbijo».

## Semana 5 · desde el 02/11/2026

**Hecho**
- 02/11: Se ponen al día el documento final (224 pruebas, Render + Supabase), el README, las guías y esta bitácora.
- 03/11: **Fase M.1**: el mapa de Zonas ya no dice «Todo en orden» con alertas activas; el robot no puede arrancar solo al reconectarse; la batería sin conexión se rotula como último dato (#85).
- 03/11: **Fase M.2**: `tools/demo_en_vivo.py` hace andar la web sin hardware, con un solo comando (#87).
- 03/11: **Fase M.3**: pulido visual. La revisión automática ahora detecta textos que se salen de su tarjeta (#89).
- 03/11: **Fase M.4**: se pueden resolver varias alertas a la vez, y el panel muestra la más vieja sin resolver (#90).
- 03/11: **Fase M.5**: el render 3D del robot está en la web: datos reales por zona para el empleado y el encargado, y un recorrido simulado en las páginas públicas (#93).
- 03/11: **Fase M.5 (ajuste)**: a pedido de Tiziano, la web usa sus archivos originales en iframes: los renders «Robot DROID-E3D 3D» y «DROID-E3D en la fábrica», y el juego «Patrulla DROID-E3D». Se descarta la versión reescrita a mano (#98).
- 03/11: **Fase M.6 (en curso)**: el robot cuenta marcas en el piso e informa su zona. Quedó en el PR borrador #96, solo compilado: falta probarlo en el robot con Morena (#95).

- 04/11: Se borra la versión del render reescrita a mano y se ponen al día el documento final (255 pruebas), el README y la guía de la demo. Se sacan de la base local las 90 alertas ficticias de la demo, con respaldo.
- 05/11: Morena avisa que el robot cambió el 29/10 (ruedas y ESP32-S3) y arma el #101 con lo que falta antes de exponer. Entra el logo nuevo (#72). **Fase M.7**: la web deja de decir «oruga» y aclara que hoy la IA detecta el casco.

**Problemas**
- Reescribir el render a mano no quedaba igual al original: se perdió tiempo hasta usar los archivos de Tiziano directamente (decisión 008).
- Sin placa de video, el 3D frena toda la página. Se vio en GitHub Actions, y por eso en `/app/robot` se carga a pedido.
- Al revisar el sketch del robot para la demo: todavía no habla con la web, así que la web lo muestra «Sin conexión» y sus botones no le llegan. Además, si el robot no informa su zona y no hay `DROID_ZONA_ID`, la web rechaza las alertas de la cámara (error 400). Se documenta en `DEMO-LOCAL.md` y queda la tarea 6.8.
- El proyecto de Supabase se pausó por falta de uso: hay que reactivarlo desde su panel antes de publicar.

**Próximos pasos**
- Lo que pide Morena en el #101: bilingüe, chatbot, versión online para el QR, costos y pitch con las piezas nuevas. Con Morena: conectar el robot nuevo y hacer la prueba real (6.5, #48). Capturas con el logo nuevo y README final (9.4).

## Semana 4 · desde el 26/10/2026

**Hecho**
- 27/10: Morena corrige la alarma que no cortaba, ajusta el umbral del sensor de línea a lo medido (blanco 0-450, cinta negra 1900-2700), suma el buzzer configurable y lleva a 20 s la espera entre alertas (PR #83).
- 29/10: **Cambian todos los componentes del robot**: el cuerpo pasa a ser un WALL-E impreso en 3D, con una placa ESP32-S3, ruedas con motores y su driver, servos para la cabeza y los brazos, una pantalla, un parlante y una cámara nueva. Lo que se había armado antes queda como base para el robot nuevo.

**Problemas**
- Según Morena: el sensor de línea del GPIO 34 no reacciona (se compraron TCRT5000) y el VL53L0X todavía no se probó conectado.

## Semana 3 · desde el 19/10/2026

**Hecho**
- 19/10: Morena arma el **documento final del FAT** (11 secciones según la guía del colegio), con lo que falta marcado `[COMPLETAR]`. El índice y los pendientes están en `docs/SMAT/documentacion-final/README.md`.
- 19/10: Morena, en `SMAT-hardware`: las IPs de la cámara y del robot pasan a `servidor_ia/.env` (`config.py`), las fotos de caras y los modelos descargables dejan de subirse a GitHub (Ley 25.326) y `CONTRIBUIR.md` suma los comandos de git del día a día.
- 19/10: Issue #72 para Morena: rediseñar el logo, porque no está de acuerdo con la versión 1.
- 21/10: PR #73 (`SMAT-hardware` → `main`): el CI también revisa `servidor_ia/` y `cargar_trabajadores_ia.py` explica cómo conseguir las fotos. Se ponen al día esta bitácora y el plan.
- 21/10: **Fase 9.1**: prueba automática que recorre las 17 pantallas en celular y PC, en claro y oscuro, y con el servidor caído (78 casos). Arreglos: Empleados y Zonas quedaban en «Cargando…» sin servidor, y el botón para elegir la foto de rostro cortaba su texto en el celular. 105 pruebas de la API y 112 de punta a punta.
- 21/10: **Fase 9.2**: `docs/DEMO-LOCAL.md`, guía para la demo sin internet (IP, firewall, dónde va la IP en cada pieza, simuladores y problemas comunes). La IA ahora lee también `DROID_URL` y `YOLO_API_KEY` de `servidor_ia/.env`. El README cargaba el esquema con `<`, que en PowerShell no anda: ahora usa `cmd /c`.
- 22/10: Secciones técnicas de Tiziano del documento final, en Markdown y en Word con formato APA (`docs/SMAT/documentacion-final/`). Consentimientos de las fotos confirmados. Morena sube por PR el sketch del robot con sensores de línea y de distancia (#77).
- 22/10: Datos de ejemplo cargados en Supabase con `tools/cargar_supabase.py`; login comprobado. Falta publicar en Render.
- 22/10: **Fase 9.3**: PythonAnywhere gratis ya no tiene MySQL, así que la versión online pasa a **Render + Supabase** (decisión 007). El backend funciona con MySQL y con Postgres; las 105 pruebas de la API corren también contra Postgres en GitHub Actions; las fotos van a Supabase Storage; `tools/cargar_supabase.py` carga los datos de ejemplo.

**Problemas**
- El README del documento final se subió directo a `main`, sin PR. Se le recordó la regla a Morena en el PR #73.
- Las caras siguen en el historial de git aunque ya no estén en la versión actual. El repo es privado y no se reescribe el historial, porque afectaría a toda IDEPP.
- Al bajar el cambio de Morena, git borra la carpeta local `fotos_trabajadores/`: hay que copiarla antes.

**Próximos pasos**
- Fase 9: 9.3 publicar en PythonAnywhere (falta crear la cuenta); 9.4 README final.
- Documento final: Tiziano completa diseño, desarrollo, pruebas y capturas de GitHub; Morena, robot, IA y hardware.
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
- Se definió la jerarquía: IDEPP (empresa) → DROID-E3D (producto).
- Se migró la app al repo compartido `Code7C26/IDEPP` (rama `SMAT-web`).
- Plan completo reescrito (`docs/PLAN.md`): landing pública, empresa IDEPP, hardware, push, reportes.
- Entorno verificado: Python, Node, MySQL (XAMPP), `gh`. Backend y frontend arrancan.
- Etiquetas `smat:*`, plantillas de Issue y PR, `CONTRIBUIR.md`.
- 06/10: **Fase 2 y 3** de la web: Tailwind, claro/oscuro, menú por rol y las tres pantallas del empleado.
- 06/10: **Empresa IDEPP** completa (versión 1): 29 documentos, acuerdo de socios, finanzas, legal, FODA, pitch y guion del jurado.
- 06/10: **Fase 4** de la web: mapa de la fábrica, panel, incidencias, empleados y zonas del encargado.
- 06/10: **Fase 5**: control del robot desde la web (órdenes, parada de emergencia, ruta), video en vivo, parada automática de la máquina y su reactivación, y simulador del ESP32.
- 07/10: **Fase T**: pruebas automáticas del backend (pytest) y de la web (Playwright), corriendo solas en GitHub Actions en cada PR.
- 07/10: **Fase R** (rediseño estilo SaaS): barra lateral, avisos flotantes, paneles laterales, validación en vivo, tablas ordenables con búsqueda, tarjetas con tendencia y mini gráfico, y mapa con íconos de máquina y EPP, robot animado, recorrido numerado y detalle de cada zona.
- 07/10: **Fase 6**: foto de evidencia en cada alerta, fotos de rostro con consentimiento (Ley 25.326) que maneja el encargado o el propio empleado, `GET /rostros` para la IA, simulador de YOLO y guía de la prueba real.
- 08/10: Morena reorganiza el repo (la web pasa a `src/SMAT/`, la empresa a `docs/SMAT/`) y sube su servidor de IA (YOLO + reconocimiento facial). Se renombra a `src/SMAT/servidor_ia/` y se conecta con el backend: cada alerta llega a la web con la foto, el nombre del trabajador y la zona del robot, y detiene la máquina.
- 08/10: **Revisión general**: recorrido automático de las 14 pantallas en 5 tamaños y temas (sin errores), pruebas de robustez (el servidor ya no se cae con datos raros), la baja o el cambio de rol cortan la sesión al instante, validación de la dirección del video y arreglos de la web en celular y tablet. 76 pruebas de la API y 17 de punta a punta.
- 08/10: **Fase L**: página pública de IDEPP en `/` (Inicio, Cómo funciona, Planes, Nosotros, Contacto) con los textos de la empresa, capturas reales de la app con datos ficticios, título y descripción por página, menú para celular y 4 pruebas e2e.
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

## Antes del repositorio · agosto y septiembre de 2026

**Hecho**
- 10/08: Reunión de los 5 socios en el colegio: se decide unir las dos empresas en una, con dos productos (Touch ID y DROID-E3D). Las ganancias de DROID-E3D, mitad y mitad entre Tiziano y Morena; el nombre queda para más adelante.
- 26/08: Reunión de Tiziano y Morena en el colegio: se define el diseño del robot, que use IA para detectar el equipo de protección, que se pruebe primero con la cámara del celular y qué hace cada uno (Tiziano, software y web; Morena, hardware e IA).
- Agosto y septiembre: el equipo aprende cómo funciona cada componente del robot y los va conectando de a uno para probar su función.
