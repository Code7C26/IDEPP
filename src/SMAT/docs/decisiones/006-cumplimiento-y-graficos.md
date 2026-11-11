# 006 · Cómo medimos el cumplimiento y cómo lo mostramos

**Fecha:** 2026-10-09 · **Estado:** aceptada

## Contexto
La página Reportes tiene que responder dos preguntas del encargado: «¿cuántas faltas hubo y dónde?» y
«¿quién (o qué zona) cumple peor con el equipo de protección?». Lo tenemos que poder explicar en una frase.

## Opciones para medir el cumplimiento
1. **Días sin alertas / días del período**: fácil de explicar y no castiga dos veces el mismo mal día.
2. Alertas por persona: depende de cuántas veces pasó el robot, así que no se puede comparar entre zonas.
3. Alertas / horas trabajadas: más justo, pero no tenemos las horas de cada empleado.

## Decisión
- **Cumplimiento = días sin alertas / días del período** (la misma cuenta que ve el empleado en su inicio).
- Niveles: **Bien** 90 % o más · **A mejorar** 75 a 89 % · **Riesgo** menos de 75 %. Siempre se muestra
  la palabra además del color, para que no dependa de distinguir colores.
- Gráficos con `recharts`, **una sola serie** por gráfico y en azul (validado para daltonismo y contraste,
  en claro y en oscuro). El rojo y el verde quedan para los estados (alerta / todo bien).
- Las alertas sin persona identificada cuentan para la zona, pero no para ningún empleado.

## Consecuencias
- Un empleado con muchas alertas el mismo día baja igual que uno con una sola ese día: lo que se mide es
  la constancia. El detalle por cantidad está en las columnas «Alertas» y «Días con alerta».
- Los umbrales (90 y 75) son una propuesta: se ajustan con la fábrica cliente si hace falta.
- La página Reportes se carga aparte (`lazy`), para que la librería de gráficos no haga más lenta la app del empleado.
