# 009 · La empresa pasa a ser IDEPP, con dos productos

**Fecha:** 2026-11-10 · **Estado:** aceptada (PR #104, de Morena; completada el 11/11)

## Contexto
Hasta el 10/11 la jerarquía era TOUCH (empresa madre) → SMAT (división de Toro y Morena) → DROID-E3D (producto).
Los dos equipos decidieron ser **una sola empresa, IDEPP**, con dos productos: Touch ID (Alexandra, Sol y Lola) y
DROID-E3D (Toro y Morena). Cada uno sigue con las mismas funciones y el mismo reparto de tareas.

## Decisión
- **IDEPP es de los 5 socios.** Cada producto reparte sus ganancias dentro de su equipo: DROID-E3D, 50/50 entre Toro
  y Morena. Lo que es de toda la empresa (la marca IDEPP, los gastos comunes) se decide entre los 5. El detalle está
  en `docs/SMAT/EMPRESA-SMAT/02-organizacion/acuerdo-de-socios.md`.
- Los nombres **TOUCH y SMAT dejan de usarse** de cara a los clientes. La firma es «DROID-E3D by IDEPP».
- En los renders y el juego, el chasis del robot dice IDEPP y los títulos, DROID-E3D.

## Consecuencias
- **No cambian hasta después de la defensa:** las carpetas `SMAT/`, las ramas `SMAT-*` y las etiquetas `smat:*`.
  Render y el CI dependen de esas rutas. Son nombres técnicos y no los ven los clientes.
- El repositorio pasó a llamarse `Code7C26/IDEPP`. GitHub redirige los enlaces viejos a `Code7C26/TOUCH-ID`.
- Los originales de los renders en Claude todavía dicen SMAT: `tools/copiar_renders.py` los convierte al copiarlos,
  y `backend/tests/test_renders.py` falla si alguno vuelve a decir SMAT.
- Lo que es del equipo de Touch ID (`*/TOUCH-ID/` y el `README.md` de la raíz) lo actualiza ese equipo.
