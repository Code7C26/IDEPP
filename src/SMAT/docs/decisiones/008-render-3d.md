# 008 · Render 3D del robot en la web (Three.js) y posición por zona

**Fecha:** 2026-11-03 · **Estado:** aceptada

## Contexto
Toro pidió que el render 3D del robot se vea en la web, también en la pantalla del empleado, y que muestre en
tiempo real por dónde anda. El render ya existía como una página aparte hecha con Three.js.

## Opciones
1. **Three.js dentro de la web:** interactivo y conectado a los datos, pero suma una librería.
2. **Un video del render:** sin librería nueva, pero no se puede girar ni conectar al robot.

## Decisión
Three.js (1), en la **versión 0.128.0, fija**: es la del render original. Con una versión nueva cambian los colores
y las luces, y Toro lo quiere igual al original. Se descarga solo en las páginas que muestran el render, en un archivo
aparte y fuera de lo que guarda la PWA. Si el equipo no tiene WebGL, o no se puede descargar, la página avisa y sigue andando.

El render es el mismo del original: robot, piso con la línea amarilla, casco, cámara, luces, botones y tipografías
(guardadas en `public/fuentes`, para no depender de Google Fonts). Primero se probó una planta en 3D con el robot chico
encima, y se descartó porque no se parecía. Dónde anda el robot se ve en el mapa 2D, debajo del render.

Tres diferencias con el original, porque está dentro de una página larga: la rueda hace zoom solo con Ctrl, en el
celular un dedo baja por la página y dos giran, y las sombras tienen menos detalle en el celular.

## Consecuencias
- **La posición es por zona, no al centímetro.** El robot no tiene cómo medir más que eso, y la web lo aclara.
- **No se inventa movimiento.** Las orugas giran solo si el robot está recorriendo. Sin conexión se ve gris y quieto, y
  el cartel dice que es el último dato. Con datos reales la pantalla del modelo nunca dice «CASCO OK»: la web no sabe
  si el trabajador que el robot tiene adelante lo lleva puesto.
- **Para que el robot real se mueva en la pantalla, tiene que informar su zona** (`zona_actual_id` en
  `POST /robot/reporte`). Se eligió que cuente marcas en el piso con sus sensores de línea (tarea M.6). Mientras tanto
  se prueba con `tools/demo_en_vivo.py`.
- **Las páginas públicas muestran el modelo**, con sus botones y sus piezas, y aclaran que no son datos reales. No
  llaman al backend. La lista de piezas es la del original y dice «Pantalla TFT», aunque `robot_droid.ino` usa una LCD
  de 2 líneas: si el robot final lleva la LCD, hay que corregir el render y esa lista.
- **El empleado ve la zona exacta del robot**, con `GET /robot/posicion`, que solo da zona, estado y conexión. Riesgo
  conocido: alguien podría ponerse el casco solo cuando el robot se acerca, y el jurado puede preguntarlo. Se aceptó
  porque el robot igual se ve en la planta y su recorrido es fijo.
- **El empleado no ve las alertas de otros.** En su mapa, las demás zonas no dicen «Todo en orden»: solo si su
  máquina está parada.
