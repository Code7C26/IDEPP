# Guion para el jurado

> **Estado:** completo (v1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 06/10/2026

**Para qué sirve:** orden de la presentación final, quién habla en cada parte y cómo responder las preguntas.

## Estructura (15 minutos)

| # | Parte | Quién | Min. | Qué se muestra |
|---|---|---|---|---|
| 1 | Presentación | Toro | 1 | IDEPP; quiénes somos |
| 2 | El problema | Morena | 2 | Accidentes por no usar EPP; el supervisor no puede estar en todos lados |
| 3 | La solución | Toro | 2 | Qué es DROID-E3D; diagrama cámara → IA → backend → web → máquina |
| 4 | **Demo en vivo** | Morena (robot) y Toro (web) | 5 | Ver abajo |
| 5 | Cómo está hecho | Toro (software) y Morena (hardware e IA) | 2 | Arquitectura, seguridad, GitHub |
| 6 | El negocio | Toro | 2 | Cliente, precios, proyección, FODA |
| 7 | Cierre | Morena | 1 | Qué sigue: piloto en una fábrica real |

## Demo paso a paso

1. **Toro** abre el panel del encargado en el proyector y el celular del empleado: todo en verde.
2. **Morena** pone el robot en marcha desde la web (**Iniciar**): el estado cambia a «recorriendo».
3. Un integrante entra a la zona **sin casco**.
4. La IA lo detecta → aparece la **alerta con foto** en el panel y en el celular del empleado → la máquina de la zona (una lámpara conectada al relé) **se apaga**.
5. **Toro** abre el detalle de la alerta, la **resuelve** y **reactiva la máquina**: la lámpara se enciende.
6. **Morena** toca **PARADA DE EMERGENCIA** en la web: el robot se detiene.
7. **Toro** muestra la **auditoría**: quedó registrado quién hizo cada acción.

## Plan B (si algo falla)

| Falla | Qué hacemos |
|---|---|
| No hay wifi | Usar el celular como punto de acceso (probado antes) |
| La IA no detecta | Disparar la alerta con `simular_yolo.py` y explicarlo con honestidad |
| El robot no anda | Usar `simular_esp32.py` y mostrar el robot quieto |
| Falla todo | Video de la demo grabado el día anterior |

## Preguntas posibles

| Pregunta | Respuesta |
|---|---|
| ¿Qué pasa si la IA se equivoca? | Cada alerta muestra la confianza de la IA y una foto; el encargado la revisa y la resuelve. Se puede ajustar el umbral de confianza. |
| ¿No es invasivo filmar a los trabajadores? | No se graba video continuo: solo se guarda la foto de la alerta, por 90 días, con consentimiento escrito y para seguridad. El empleado ve sus propios datos. |
| ¿Por qué un robot y no cámaras fijas? | Un robot cubre muchas zonas; las cámaras necesitan una por zona, cableado y obra. Además el robot puede ir a zonas que cambian. |
| ¿Qué pasa si se corta internet? | La demo y la planta funcionan en red local; la versión online es para acceder desde afuera. |
| ¿Cómo se comunica el robot con el sistema? | Por HTTP: el ESP32 consulta al servidor cada 1-2 segundos qué hacer y le informa su estado, con una clave propia. |
| ¿Cómo protegen el sistema? | Contraseñas con hash, roles validados en el servidor, claves distintas para cada máquina y registro de auditoría. |
| ¿Cuánto cuesta y cuánto ganan? | USD 2.200 de instalación (cuesta 1.343) y USD 70 por mes. Detalle en la proyección a 3 años. |
| ¿Es legal frenar una máquina? | Sí: la parada la conecta un electricista del cliente y es una medida de seguridad adicional; no reemplaza las protecciones de la máquina. |
| ¿Qué norma cumple? | Ayuda a cumplir la Ley 19.587 y el Decreto 351/79 (control del uso de EPP) y complementa la constancia de entrega de la Res. SRT 299/2011. |
| ¿Qué harían con más tiempo? | Piloto en una fábrica real, detectar otros riesgos (derrames, pasillos obstruidos) e integrar la asistencia de Touch ID. |

## Antes del día

- Ensayar 2 veces con cronómetro.
- Cargar baterías del robot, la notebook y los celulares.
- Recrear la base de datos con los datos de ejemplo.
- Grabar el video del plan B.
