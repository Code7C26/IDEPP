# 011 · DROID-E3D controla casco, chaleco y lentes

**Fecha:** 2026-11-25 · **Estado:** aceptada (producto: Morena y Tiziano, 17/11; documentos: PR #161 de Morena, 24/11;
web: este cambio)

## Contexto
La web y los documentos prometían casco, guantes, lentes y chaleco, y el primer servidor de IA buscaba también el
barbijo. Con la cámara del robot, el modelo solo detectaba bien el casco (40 a 60 % de confianza). Los guantes son
chicos y quedan fuera de la imagen o tapados por la máquina, así que era difícil detectarlos bien.

## Decisión
DROID-E3D controla **tres elementos: casco, chaleco y lentes**. Se sacan los guantes y el barbijo. Morena reentrenó
el modelo con 273 fotos de la cámara del robot (24/11): casco y chaleco con 88 a 94 % de confianza y lentes con
alrededor del 78 %.

## Qué cambia en la web
- **Backend:** las listas de EPP y de tipos de alerta salen de un solo lugar (`models.py`: `EPP_VALIDOS`,
  `TIPOS_ALERTA`, `NOMBRES_TIPO`). `POST /incidents` ya no acepta `sin_guantes` (400) y una zona no puede pedir guantes.
- **Datos que ya existen:** no hace falta migrar.
  - Si una zona pedía guantes, se lee sin ellos y, al guardarla, quedan afuera.
  - Las alertas viejas «sin guantes» se conservan y se siguen viendo con su nombre en las listas, el detalle y el PDF.
  - El reporte diario suma esas alertas al final (`tipos`), así los totales siguen cerrando.
- **Web:** filtros, formulario de zona, gráficos y textos públicos con los tres elementos. El asistente de preguntas
  frecuentes, la guía y el juego también.
- **Datos de ejemplo:** las zonas piden casco, chaleco y lentes según su riesgo. Las alertas de ejemplo de guantes
  pasan a ser de un elemento que esa zona pide.

## Consecuencias
- El servidor de IA de Morena no se toca: todavía tiene «guantes» en su tabla de nombres, pero el modelo nuevo no los
  detecta, así que nunca manda esa falta.
- En los renders hechos en Claude algunos operarios tienen guantes puestos: es parte del dibujo, no algo que se controle.
