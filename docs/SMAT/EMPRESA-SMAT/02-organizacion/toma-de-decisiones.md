# Toma de decisiones

> **Estado:** completo (v1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 06/10/2026

**Para qué sirve:** cómo deciden Toro y Morena, y cómo se deja constancia.

## Tipos de decisión

| Tipo | Ejemplos | Quién decide |
|---|---|---|
| **Del área** | Cómo programar una pantalla, qué sensor usar | El responsable del área (ver `roles-y-responsabilidades.md`) |
| **Compartida** | Precios, clientes, gastos de más de USD 200, cambios de producto, cambios en la API del robot | Los dos socios, por unanimidad |
| **Del profe** | Entregas, fechas, requisitos del proyecto final | Se cumple; se registra con `/tarea-profe` |

## Cómo se decide una cuestión compartida

1. Quien la propone abre un **Issue con la plantilla «IDEPP · Decisión entre socios»** (etiqueta `smat:decision`): contexto, opciones con ventajas y desventajas.
2. Cada socio **vota en el Issue** (comentario) en un máximo de **48 horas**.
3. Si están de acuerdo, se anota el **resultado** y se cierra el Issue.
4. Si no hay acuerdo: se vuelve a discutir en la reunión semanal. Si sigue el empate, se pide la opinión del profe supervisor y se respeta.
5. Si la decisión cambia algo técnico, se agrega un archivo en `src/SMAT/docs/decisiones/`.

## Reuniones

- **Semanal:** lunes, 20 minutos (presencial en la escuela o por videollamada).
  1. Qué hizo cada uno.
  2. Qué traba hay.
  3. Decisiones pendientes (Issues `smat:decision` abiertos).
  4. Tareas de la semana.
- **Antes de cada entrega al profe:** revisión rápida de que todo esté subido.
- **Acta:** la escribe quien no presentó la última vez, en `actas/AAAA-MM-DD-tema.md`, el mismo día.

## Urgencias

Si algo no puede esperar (por ejemplo, un error en una demo), el responsable del área decide y lo cuenta en el grupo y en un comentario del Issue correspondiente dentro de las 24 horas.
