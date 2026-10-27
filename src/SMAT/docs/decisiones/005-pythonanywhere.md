# 005 · Despliegue: todo en PythonAnywhere

**Fecha:** 2026-10-05 · **Actualizada:** 2026-10-15 · **Estado:** reemplazada por la 007 (22/10/2026: el plan gratis ya no tiene MySQL)

## Contexto
La demo se muestra en red local y además tiene que existir una versión online accesible desde cualquier celular.

## Opciones
1. **PythonAnywhere** (backend + MySQL) + **Vercel o Netlify** (frontend): dos cuentas, dos direcciones y CORS.
2. **Todo en PythonAnywhere:** Flask sirve la API y también la web compilada (`npm run build`).
3. Supabase (base PostgreSQL) + Render (Flask) + Vercel (web): tres cuentas, pasar de MySQL a PostgreSQL y
   Render gratis se apaga a los 15 min sin uso.
4. VPS propio: máximo control, más mantenimiento.

## Decisión
**Opción 2** (el 05/10 se había elegido la 1; el 15/10 se cambió a la 2, y se descartó Supabase).
Una sola cuenta gratis, la base sigue en MySQL como en la PC y, al tener https, en el celular se puede
instalar la app y recibir notificaciones. Desarrollo y demo local con XAMPP.

## Consecuencias
- La web compilada usa `VITE_API_URL=/api` (`frontend/.env.production`): web y API en la misma dirección, sin CORS.
- `backend/wsgi.py` es la entrada para el servidor; `tools/cargar_datos_ejemplo.py` carga los datos de ejemplo
  y cambia la contraseña `pass123` de los usuarios de ejemplo.
- La web se compila en la PC y se sube como `web.tgz` (pasos en `docs/DESPLIEGUE.md`).
- Los archivos subidos (evidencias) viven en el disco de PythonAnywhere.
- El plan gratis solo deja salir a internet hacia una lista de sitios: algunos servicios de push podrían no estar.
