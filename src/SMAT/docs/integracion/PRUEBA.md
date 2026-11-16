# Prueba de integración real (Fase 6.5)

Guía para la primera prueba con el hardware de verdad: robot, relé, cámara y YOLO de Morena
conectados a la web de Tiziano. Se completa **el día de la prueba** y se sube al repo con los resultados.

**Fecha:** ____ · **Participantes:** Tiziano, Morena · **Lugar:** ____

## Antes de empezar

- [ ] Las dos PCs y el ESP32 en la **misma red WiFi**. IP de la PC del backend: `____`
- [ ] Backend andando (`python app.py`) y el firewall de Windows deja entrar al puerto 5000
- [ ] `http://<IP>:5000/api/health` responde desde el celular
- [ ] Morena tiene `YOLO_API_KEY` y `ROBOT_API_KEY` (pasadas **por fuera de GitHub**)
- [ ] Al menos 2 empleados de prueba con 3 fotos de rostro cada uno, **con consentimiento** (sin datos de personas reales que no aceptaron)
- [ ] Ruta del robot configurada en la web (Robot → Ruta) y URL del video cargada

## 1. Robot (ESP32)

| # | Paso | Resultado esperado | ✔ / ✘ | Notas |
|---|---|---|---|---|
| 1.1 | Encender el robot | En el Panel el robot pasa a "Conectado" en menos de 5 s | | |
| 1.2 | Web: Iniciar | El robot arranca y la zona actual cambia en el mapa | | |
| 1.3 | Web: Pausar / Iniciar | Se detiene y sigue desde donde estaba | | |
| 1.4 | Web: Parada de emergencia | Se detiene al instante; solo sale con "Detener" | | |
| 1.5 | Apagar el WiFi del robot | A los 10 s la web muestra "Sin conexión" | | |

## 2. Máquina (relé)

| # | Paso | Resultado esperado | ✔ / ✘ | Notas |
|---|---|---|---|---|
| 2.1 | Web: Detener máquina (Panel → zona) | El relé corta en menos de 2 s | | |
| 2.2 | Web: Reactivar máquina | El relé vuelve a cerrar | | |

## 3. Cámara e IA (YOLO)

| # | Paso | Resultado esperado | ✔ / ✘ | Notas |
|---|---|---|---|---|
| 3.1 | Video en vivo en la página Robot | Se ve la imagen con las cajas de detección | | |
| 3.2 | YOLO lee `GET /rostros` y descarga las fotos | Reconoce a los empleados de prueba | | |
| 3.3 | Empleado de prueba **sin casco** frente a la cámara | Aparece una alerta con **foto**, su nombre y la zona correcta | | |
| 3.4 | Misma prueba en una zona con máquina | La máquina se detiene sola (relé) | | |
| 3.5 | Persona sin fotos cargadas | Alerta como "Desconocido" | | |
| 3.6 | El empleado borra sus fotos desde Mi perfil | YOLO deja de reconocerlo en la próxima lectura de `/rostros` | | |

## 4. De punta a punta (lo que se muestra en la demo)

| # | Paso | Resultado esperado | ✔ / ✘ | Tiempo |
|---|---|---|---|---|
| 4.1 | Falta de EPP → alerta en el panel del encargado | Menos de 5 s | | |
| 4.2 | Falta de EPP → máquina detenida | Menos de 5 s | | |
| 4.3 | Encargado resuelve la alerta y reactiva la máquina | Queda en Auditoría | | |

## Problemas encontrados

| Problema | Quién lo resuelve | Issue |
|---|---|---|
| | | |

## Conclusión

____
