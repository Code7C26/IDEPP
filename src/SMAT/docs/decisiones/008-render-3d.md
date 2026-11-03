# 008 · Renders 3D y juego: los archivos originales, dentro de la web

**Fecha:** 2026-11-03 · **Estado:** aceptada

## Contexto
Toro pidió que el render 3D del robot se vea en la web, también en la pantalla del empleado, y que idealmente muestre
en tiempo real por dónde anda. Hizo en Claude tres páginas: «Robot SMAT 3D», «SMAT en la fábrica» y el juego
«Patrulla SMAT».

## Opciones
1. **Reescribir el render como componentes de React:** se probó primero, y no quedó igual. Cualquier cambio en Claude
   habría que volver a pasarlo a mano.
2. **Usar los archivos originales en un iframe:** se ven exactamente igual y se actualizan copiándolos.

## Decisión
Los archivos originales en `frontend/public/robot3d`, en iframes (`components/RenderEmbebido.jsx`). No se editan ahí:
se cambian en Claude, se descargan y se copian con `backend/tools/copiar_renders.py`.

## Consecuencias
- La copia solo cambia los enlaces a internet por archivos locales (Three.js 0.128, la versión que usan, y las
  tipografías). Sin esto no andarían en la demo sin conexión.
- `embebido.js` los acomoda solo cuando están dentro de la web: se pausan fuera de la pantalla, la rueda y un dedo
  siguen bajando por la página (zoom con Ctrl + rueda, y dos dedos para girar en el celular), y con `?solo=escena` se
  oculta lo que no sea la escena. Abiertos solos, no hace nada.
- No entran en lo que guarda la PWA, porque pesan mucho. Sin conexión, en una app instalada, no se ven.
- **El 3D comparte el hilo con la página** y, sin placa de video, la deja lenta (se vio en GitHub Actions). Por eso en
  `/app/robot`, donde está la parada de emergencia, la simulación se carga recién al tocar «Ver la simulación».
- Sin WebGL la página avisa y sigue andando.
- **Son simulaciones.** Sus operarios, faltas y sectores son de ejemplo, y no están conectados al robot real. Por eso
  en la app del empleado y del encargado llevan el cartel «Simulación» y se ve solo la escena, sin el registro de
  faltas de ejemplo. Lo real es el texto de estado y el mapa con la zona (`GET /robot/posicion`).
- **La posición real es por zona, no al centímetro**, y el robot todavía no la informa (tarea M.6).
- **El empleado ve la zona exacta del robot.** Riesgo conocido: alguien podría ponerse el casco solo cuando el robot se
  acerca, y el jurado puede preguntarlo. Se aceptó porque el robot igual se ve en la planta y su recorrido es fijo.
- **El empleado no ve las alertas de otros.** En su mapa, las demás zonas no dicen «Todo en orden»: solo si su máquina
  está parada.
- Los archivos dicen cosas que el proyecto todavía no tiene decididas: «Pantalla TFT» (`robot_droid.ino` usa una LCD de
  2 líneas) y solo hablan del casco (la web habla de 4 EPP). Se corrigen en Claude si hace falta.
