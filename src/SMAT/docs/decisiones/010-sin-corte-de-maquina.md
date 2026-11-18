# 010 · DROID-E3D no corta máquinas: el robot se detiene y da la alarma

**Fecha:** 2026-11-18 · **Estado:** aceptada (producto: PR #149 de Morena, 15/11; web: este cambio)

## Contexto
Hasta noviembre, cuando la IA veía a alguien sin su equipo, la web marcaba la máquina de esa zona como detenida y un
ESP32 con relé la cortaba hasta que el encargado la reactivara. El 15/11 Morena y Tiziano decidieron que el producto
no corte máquinas: cortar la energía de una máquina de un cliente necesita un electricista, es un riesgo si se hace
mal y no hacía falta para que la persona se ponga el equipo.

## Decisión
Cuando la IA detecta una falta, **el robot se detiene en la zona, muestra el signo de peligro y hace sonar la
alarma**; la alerta llega con foto a la web, como antes. Las máquinas de la fábrica no se tocan.

## Qué cambia en la web
- **Backend:** salen la parada automática al crear una alerta, los endpoints `GET /zones/<id>/maquina`,
  `PUT /zones/<id>/reactivar` y `PUT /zones/<id>/detener`, el campo `maquina_activa` y el conteo de paradas en los
  reportes (ahora muestran las zonas con alertas). Cada alerta de la IA queda en la auditoría como hecha por el «Sistema».
- **Web:** Zonas, Panel, mapa y la zona del empleado ya no muestran el estado de la máquina ni los botones para detenerla
  o reactivarla. Cada zona sigue teniendo el nombre de su máquina o puesto, para reconocerla en el mapa.
- **Páginas públicas:** el robot tiene orugas y da la alarma en la zona; ya no dicen que frena la máquina.
- Se borra `docs/integracion/esp32_maquina.ino` y el simulador ya no tiene la opción `--maquinas`.

## Consecuencias
- Las bases que ya existen conservan la columna `maquina_activa` sin usarla: no hace falta migrar.
- La auditoría vieja sigue mostrando «Máquina detenida por una alerta» y «Reactivó una máquina».
- El servidor de IA de Morena no se toca: lee `maquina_detenida` con `.get()`, así que simplemente deja de mostrar ese aviso.
