# 004 · PWA + Web Push para avisar al celular

**Fecha:** 2026-10-05 · **Estado:** aceptada

## Contexto
Una alerta de EPP tiene que llegar al encargado y al empleado aunque no tengan la web abierta.

## Opciones
1. **PWA + Web Push** (pywebpush): la web se instala en el celular y recibe notificaciones.
2. WebSockets: instantáneo, pero solo con la web abierta y PythonAnywhere no los soporta.
3. App nativa: demasiado trabajo para el plazo.

## Decisión
PWA + Web Push, con polling cada 3 s y sonido como respaldo.

## Consecuencias
- Push exige HTTPS: en el celular solo funciona con la versión online (no con la IP de la PC).
- PythonAnywhere gratis limita las conexiones salientes; hay que verificar que los servicios de push estén permitidos.
- El service worker (vite-plugin-pwa, modo generateSW) se genera solo con `npm run build`: en `npm run dev`
  no está, para que los cambios se vean al instante. La PWA y las notificaciones se prueban con
  `npm run build` y abriendo la web que sirve Flask en http://localhost:5000 (o en la versión online).
