# 007 · Versión online: Render (Flask) + Supabase (Postgres y fotos)

**Fecha:** 2026-10-22 · **Estado:** aceptada · **Reemplaza a:** 005 (PythonAnywhere)

## Contexto
Al crear la cuenta de PythonAnywhere (22/10) vimos que el plan gratis ya no incluye MySQL y bloquea las
conexiones a bases de datos externas. La 005 dejó de servir sin pagar.

## Opciones
1. **PythonAnywhere pago** (USD 5 por mes): MySQL sin tocar el código.
2. **SQLite en PythonAnywhere gratis:** pocos cambios, pero la base es un archivo y no se puede mostrar
   una base de datos "de verdad".
3. **Render + Supabase**, los dos gratis: Flask en Render, la base en Postgres de Supabase y las fotos en
   Supabase Storage.

## Decisión
**Opción 3**, elegida por los socios. No cuesta nada y Supabase es un servicio que se usa en la industria.

## Consecuencias
- El backend funciona con **MySQL** (PC, pruebas, demo local) y con **Postgres** (internet): si existe
  `DATABASE_URL`, usa Postgres (`config.py`). Las tablas en Postgres salen de `models.py`, que repite los
  `DEFAULT` de `schema.sql` con `server_default`.
- Las **105 pruebas de la API** corren también contra Postgres en GitHub Actions (trabajo `postgres`), y la app
  arranca con `gunicorn` como en Render.
- Los datos de ejemplo se cargan una vez con `tools/cargar_supabase.py`: se arman en el MySQL de la PC y se
  copian a Supabase (`tests/base_datos.copiar_a_postgres`).
- Las **fotos** van a Supabase Storage (bucket privado), porque el disco de Render se borra al dormirse. Se siguen
  pidiendo a `/api/uploads/...` con los mismos permisos. Si Storage falla, la alerta se guarda igual, sin foto.
- Se activa **RLS** en todas las tablas: la API web propia de Supabase no puede leer nada; el backend entra como
  dueño de las tablas y no lo afecta.
- Librerías nuevas: `psycopg2-binary` (Postgres) y `gunicorn` (servidor de Render).
- Render gratis se duerme a los 15 minutos sin uso (la primera visita tarda alrededor de 1 minuto) y Supabase
  pausa el proyecto tras una semana sin uso. Para la feria se usa la demo local (`docs/DEMO-LOCAL.md`).
- Render publica solo en cada merge a `main`; ya no hay que subir paquetes a mano.
