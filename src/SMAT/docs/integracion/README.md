# Ejemplos de integración (hardware e IA)

Código de **referencia** para conectar el robot, las máquinas y el servidor de IA con el backend.
No es el código final: cada uno lo adapta. El contrato oficial está en [`../API.md`](../API.md).

| Archivo | Para quién | Qué muestra |
|---|---|---|
| `esp32_robot.ino` | ESP32 del robot | Pregunta comandos cada 1,5 s, los ejecuta, confirma y reporta batería/estado |
| `esp32_maquina.ino` | ESP32 de la máquina | Pregunta si la máquina está activa y abre/cierra el relé |
| `cliente_yolo.py` | Servidor de IA | Lee zonas y EPP, reporta faltas con foto de evidencia, baja fotos de rostros |
| `PRUEBA.md` | Tiziano y Morena | Lista de pasos para la primera prueba con el hardware real (Fase 6.5) |

## Sin hardware: el simulador
`backend/tools/simular_esp32.py` hace lo mismo que `esp32_robot.ino` y `esp32_maquina.ino` (misma API): úsenlo para ver cómo debería comportarse la placa y comparar sus resultados.

## Antes de probar
1. Backend corriendo (`python app.py`) y MySQL iniciado.
2. Pedirle a Tiziano las claves `YOLO_API_KEY` y `ROBOT_API_KEY` **por fuera de GitHub** (nunca se suben al repo).
3. En la demo local, la PC y los ESP32 tienen que estar en la **misma red WiFi**, y el Firewall de Windows debe permitir el puerto 5000.
4. Poner la IP de la PC (no `localhost`) en `URL_BASE` / `DROID_URL`.
