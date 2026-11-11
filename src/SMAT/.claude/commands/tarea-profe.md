---
description: Registra un pedido del profe como Issue de GitHub y en el PLAN
argument-hint: texto del pedido (pegado de Classroom)
---
El profe pidió: $ARGUMENTS

1. Creá un Issue con `gh issue create` (label `smat:profe` + el área: `smat:web`, `smat:hardware`,
   `smat:empresa`). Incluí la fecha de entrega si la menciona.
2. Si es de la web: agregala en docs/PLAN.md, sección "Tareas del profe", como
   `- [ ] P.N descripción (#issue)` y decime en qué fase encaja.
3. Si afecta a la fábrica cliente: actualizá docs/FABRICA-CLIENTE.md.
4. Si es de la empresa (IDEPP): agregala a la Fase E y decime qué socio la hace.
5. Si es de hardware/IA: asignala a Morena (responsable de hardware/IA) y avisame.
6. No empieces a hacerla hasta que yo lo diga. Resumen de máximo 4 líneas.
