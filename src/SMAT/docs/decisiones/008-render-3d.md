# 008 · Renders 3D y juego: los archivos originales, dentro de la web

**Fecha:** 2026-11-03 · **Estado:** aceptada

## Contexto
Toro pidió que el render 3D del robot se vea en la web, también en la pantalla del empleado, y que idealmente muestre
en tiempo real por dónde anda. Hizo en Claude tres páginas: «Robot IDEPP 3D», «IDEPP en la fábrica» y el juego
«Patrulla IDEPP».

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
  Por lo mismo, en GitHub Actions solo se dibuja el juego: la fábrica y el robot en 3D dentro de las páginas se prueban
  en una máquina con video (`python tests/correr_e2e.py -k "renders or escena"`).
- Sin WebGL la página avisa y sigue andando.
- **Son simulaciones.** Sus operarios, faltas y sectores son de ejemplo, y no están conectados al robot real. Por eso
  en la app del empleado y del encargado llevan el cartel «Simulación» y se ve solo la escena, sin el registro de
  faltas de ejemplo. Lo real es el texto de estado y el mapa con la zona (`GET /robot/posicion`).
- **La posición real es por zona, no al centímetro**, y el robot todavía no la informa (tarea M.6).
- **El empleado ve la zona exacta del robot.** Riesgo conocido: alguien podría ponerse el casco solo cuando el robot se
  acerca, y el jurado puede preguntarlo. Se aceptó porque el robot igual se ve en la planta y su recorrido es fijo.
- **El empleado no ve las alertas de otros.** En su mapa, las demás zonas no dicen «Todo en orden»: solo si su máquina
  está parada.
- Los archivos muestran el robot anterior: orugas, driver DRV8833 y pantalla de 1,3". El robot cambió el 29/10 a ruedas,
  TB6612FNG, ESP32-S3 y pantalla de 1,54". Se actualizan en Claude y se vuelven a copiar; hasta entonces, «Cómo
  funciona» aclara debajo del render que es un modelo de diseño.
