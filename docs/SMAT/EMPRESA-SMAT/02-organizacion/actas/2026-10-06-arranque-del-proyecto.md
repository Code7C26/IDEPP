# Acta 06/10/2026 · Arranque de SMAT

**Asistentes:** Toro (con asistencia de Claude para la redacción). Morena revisa esta acta en el Pull Request.
**Modalidad:** trabajo remoto

## Temas

1. Organización de SMAT como división de TOUCH.
2. Repositorio y forma de trabajo.
3. Plan de DROID-E3D y estado de avance.
4. Documentos de la empresa.

## Decisiones

- SMAT es una **división de TOUCH**; su producto es **DROID-E3D** (robot + web). Socios: **Toro** y **Morena**. Morena es además responsable de hardware e IA.
- Todo el trabajo se sube al repositorio compartido **`Code7C26/TOUCH-ID`**, en las carpetas `DROID-E3D-APP/` y `EMPRESA-SMAT/`, sin tocar las de TOUCH.
- Ramas: `SMAT-web`, `SMAT-hardware`, `SMAT-empresa`. Todo entra a `main` por Pull Request.
- Las tareas del profe se registran como Issues `smat:profe`.
- Comunicación con el robot por **HTTP** (el ESP32 consulta cada 1-2 s); contrato en `DROID-E3D-APP/docs/API.md`.
- Se completan los 29 documentos de `EMPRESA-SMAT/` (versión 1) para revisión de Morena.

## Estado del producto

- Backend completo para el MVP (roles, zonas, incidencias, auditoría, endpoints del robot).
- Web: base nueva (claro/oscuro, celular y PC) y pantallas del empleado terminadas.
- Reporte de avance entregado: **38 %** del MVP (05/10/2026).

## Tareas

| Qué | Quién | Para cuándo |
|---|---|---|
| Revisar y aprobar los documentos de `EMPRESA-SMAT/` (en especial el acuerdo de socios) | Morena | 13/10/2026 |
| Revisar el contrato de la API del robot (`docs/API.md`) | Morena | 13/10/2026 |
| Panel del encargado (Fase 4 de la web) | Toro | 12/10/2026 |
| Robot y relé funcionando contra el backend | Morena | 19/10/2026 |
