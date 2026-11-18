# Fábrica cliente

> **BORRADOR con datos de ejemplo.** Lo que dice `TODO (profe/cliente)` hay que reemplazarlo por los datos
> reales de la empresa donde se instala DROID-E3D. De acá salen los datos de prueba de `schema.sql`.

## Datos generales
| Dato | Valor |
|---|---|
| Nombre de la fábrica | TODO (profe/cliente) |
| Rubro | TODO (profe/cliente) (ej. metalúrgica, alimenticia) |
| Cantidad de empleados | TODO (profe/cliente) |
| Turnos | TODO (profe/cliente) (ej. mañana / tarde / noche) |
| Encargado de seguridad e higiene | TODO (profe/cliente) |

## Zonas y su máquina o puesto (ejemplo)
| Zona | Máquina | EPP obligatorio | Riesgo |
|---|---|---|---|
| Zona A · Corte | Sierra circular | casco, lentes, guantes | Proyección de partículas, cortes |
| Zona B · Soldadura | Soldadora MIG | casco, lentes, guantes, chaleco | Chispas, radiación |
| Zona C · Prensa | Prensa hidráulica | casco, guantes | Aplastamiento |
| Zona D · Depósito | Autoelevador | casco, chaleco | Tránsito de vehículos |

## Empleados de prueba (ejemplo)
6 empleados repartidos en las zonas + 1 encargado. Datos ficticios; **no cargar datos reales ni fotos
de personas sin su consentimiento** (Ley 25.326).

## Qué pasa cuando se detecta una falta
1. El robot recorre las zonas en el orden de la ruta.
2. La IA detecta a un empleado sin un EPP obligatorio de su zona.
3. Se registra la incidencia (con foto) y se avisa al empleado y al encargado.
4. El robot se detiene en la zona, muestra el signo de peligro y suena la alarma. Las máquinas no se cortan (decisión 010).

## Plano de la planta
TODO (profe/cliente): croquis o medidas de la planta para armar el mapa en grilla.
