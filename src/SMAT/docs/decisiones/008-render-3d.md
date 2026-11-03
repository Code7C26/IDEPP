# 008 · Render 3D del robot en la web (Three.js) y posición por zona

**Fecha:** 2026-11-03 · **Estado:** aceptada

## Contexto
Toro pidió que el render 3D del robot se vea en la web, también en la pantalla del empleado, y que muestre en
tiempo real por dónde anda. El render ya existía como una página aparte hecha con Three.js.

## Opciones
1. **Three.js dentro de la web:** interactivo y conectado a los datos, pero suma una librería.
2. **Un video del render:** sin librería nueva, pero no se puede girar ni conectar al robot.

## Decisión
Three.js (1). Se descarga solo en las páginas que muestran el render, en un archivo aparte y fuera de lo que guarda
la PWA. Si el equipo no tiene WebGL, o no se puede descargar, se ve el mapa 2D de siempre.

## Consecuencias
- **La posición es por zona, no al centímetro.** El robot no tiene cómo medir más que eso. El paso de una zona a otra
  es una animación, y la web lo aclara debajo del render.
- **No se inventa movimiento.** Sin conexión el robot se ve gris y quieto, y el texto dice que es el último dato.
- **Para que el robot real se mueva en la pantalla, tiene que informar su zona** (`zona_actual_id` en
  `POST /robot/reporte`). Se eligió que cuente marcas en el piso con sus sensores de línea (tarea M.6). Mientras tanto
  se prueba con `tools/demo_en_vivo.py`.
- **Las páginas públicas muestran un recorrido simulado**, con un cartel que lo aclara. No llaman al backend: nunca
  muestran al robot real.
- **El empleado ve la zona exacta del robot**, con `GET /robot/posicion`, que solo da zona, estado y conexión. Riesgo
  conocido: alguien podría ponerse el casco solo cuando el robot se acerca, y el jurado puede preguntarlo. Se aceptó
  porque el robot igual se ve en la planta y su recorrido es fijo.
- **El empleado no ve las alertas de otros.** En su vista, las demás zonas no dicen «Todo en orden»: solo si su
  máquina está parada.
