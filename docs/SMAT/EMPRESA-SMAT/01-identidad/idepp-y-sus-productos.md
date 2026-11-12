# IDEPP y sus dos productos

> **Estado:** completo (v2) · **Responsable:** Morena · **Revisión:** Tiziano · **Actualizado:** 10/11/2026

**Para qué sirve:** explica cómo está armada IDEPP y qué equipo hace cada producto, para evitar malentendidos con clientes y con el jurado.

## Una empresa, dos productos

**IDEPP** es una sola empresa con **5 socios** y **dos productos**:

| | **TOUCH-ID** | **DROID-E3D** |
|---|---|---|
| Qué es | Asistencia por huella dactilar | Robot que controla el uso de EPP en la fábrica |
| Equipo | Alexandra, Sol y Lola | Tiziano y Morena |
| Carpetas en el repo | `assets/`, `design/`, `docs/`, `src/` → subcarpeta `TOUCH-ID/` | Las mismas → subcarpeta `SMAT/` (`src/SMAT/` web e IA, `docs/SMAT/` empresa) |

> Las carpetas y ramas de DROID-E3D todavía se llaman `SMAT` (el nombre anterior) porque el servidor y las pruebas automáticas dependen de esas rutas. Se renombran después de la defensa.

## Qué comparten

- **La empresa y la marca:** los dos productos se presentan como de IDEPP.
- **El repositorio** `Code7C26/IDEPP`, el tablero «Kanban TOUCH-ID» y el profe supervisor.
- **El tipo de cliente:** fábricas y PyMEs industriales. Un mismo cliente puede usar TOUCH-ID para la asistencia y DROID-E3D para la seguridad.

## Qué decide cada equipo

- **Producto, plan y presupuesto:** cada equipo decide sobre su producto sin consultar al otro.
- **Ramas y revisiones:** el equipo de DROID-E3D trabaja en `SMAT-web`, `SMAT-hardware` y `SMAT-empresa`, y sus Pull Requests los revisan Tiziano y Morena.
- **Etiquetas y plantillas:** lo de DROID-E3D lleva el prefijo `smat` para no mezclarse con TOUCH-ID.
- **Ganancias:** cada equipo se reparte lo que deja su producto (ver el [acuerdo de socios](../02-organizacion/acuerdo-de-socios.md)).

## Qué se decide entre los 5

- Cambios que afecten a todo el repositorio (por ejemplo, el `README.md` de la raíz o la configuración de GitHub).
- El nombre, el logo y la imagen de IDEPP.
- Ofrecer a un mismo cliente los dos productos juntos (precio combinado).
- El ingreso de un socio nuevo.

## Cómo se presenta

- En documentos y la web de DROID-E3D: **«DROID-E3D by IDEPP»**.
- Hablando: «Somos IDEPP. Hacemos DROID-E3D, un robot que cuida la seguridad en la fábrica, y TOUCH-ID, para la asistencia».

## Oportunidad conjunta

TOUCH-ID sabe **quién está** en la planta; DROID-E3D sabe **si está protegido**. Integrados, el encargado podría ver en una sola pantalla la asistencia y el cumplimiento de EPP de cada trabajador. Es una línea futura de IDEPP, a conversar entre los dos equipos.
