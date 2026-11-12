# Finanzas de la agencia: el punto de equilibrio · DROID-E3D

> **Materia:** Emprendimiento · **Profesora:** Tamara Piccinni · **Agencia:** IDEPP
> **Equipo:** Tiziano · Morena · **Actualizado:** 12/11/2026 · Valores en pesos de noviembre de 2026 (USD 1 = $1.570)

**Pregunta:** ¿cuántos clientes necesitamos para sobrevivir?

**Fórmula:** Punto de equilibrio = Costos fijos totales ÷ (Precio de venta − Costo variable unitario)

---

## Paso 1 · Precio real

**Plan Compra: $950.000 de pago único + $55.000 por mes.** No es un número inventado:

| Referencia | Valor | Qué nos dice |
|---|---|---|
| Lo que nos cuesta instalar | $567.600 por planta | El precio tiene que dejar margen sobre esto: $950.000 deja $382.400 (40 %) |
| Lo que le ahorramos al cliente | Un técnico que controle el EPP: ≈ $1.070.000 por mes sin cargas sociales (lifeindexed.com, 2026) | El primer año de DROID-E3D ($1.610.000) equivale a un mes y medio de esa persona, que además cubre un solo turno |
| La competencia | Intenseye y Protex AI venden por cotización a multinacionales; no publican precios | Nuestra PyME objetivo no tiene una opción a su alcance: el precio apunta a ella |

Como el modelo combina un pago único y un abono mensual, el cálculo se hace **anual**, tomando lo que deja un
cliente en su primer año.

---

## Paso 2 · Cálculo de supervivencia

### Las tres variables

| Variable | Cálculo | $ |
|---|---|---|
| **Costos fijos totales (CF)** por año | Servidor 132.000 + dominio 8.500 + marca INPI 40.569 + software DNDA 5.700 + horas de mantenimiento de la plataforma 960.000 (10 h × $8.000 × 12) + marketing 300.000 | **1.446.769 ≈ 1.450.000** |
| **Precio de venta (PV)** del primer año | 950.000 + 12 × 55.000 | **1.610.000** |
| **Costo variable unitario (CVU)** del primer año | Instalación 567.600 + 12 × 32.000 (soporte y visitas) | **951.600** |

Detalle de cada costo, con su fuente: `01-viabilidad-comercial.md`, sección 3.

### Resultado

> **Punto de equilibrio = 1.450.000 ÷ (1.610.000 − 951.600) = 1.450.000 ÷ 658.400 = 2,2 → 3 clientes por año**

### Dos miradas más

| Pregunta | Cálculo | Resultado |
|---|---|---|
| ¿Cuántos clientes con abono hacen falta para que **los abonos solos** paguen los costos fijos, sin depender de vender robots? | 121.000 por mes ÷ (55.000 − 32.000) = 5,3 | **6 clientes activos** |
| ¿Y si el primero es el **cliente piloto** (paga $475.000 en lugar de $950.000)? | Su margen del primer año: 475.000 + 660.000 − 951.600 = **183.400** · Faltan 1.450.000 − 183.400 = 1.266.600 ÷ 658.400 = 1,9 | **3 clientes** (el piloto + 2 a precio completo) |

### Cómo se ve en el tiempo

Los clientes no entran todos el 1 de enero: en promedio pagan medio año de abono el primer año. Con la meta de la
proyección (3 clientes en 2027, uno de ellos piloto):

| $ | 2027 | 2028 | 2029 |
|---|---|---|---|
| Clientes nuevos / totales | 3 / 3 | 7 / 10 | 15 / 25 |
| Ingresos | 3.365.000 | 10.940.000 | 25.800.000 |
| Costos variables (instalaciones + soporte) | 2.278.800 | 6.469.200 | 15.234.000 |
| Costos fijos (incluye nuestras horas) | 1.450.000 | 1.990.000 | 3.960.000 |
| **Resultado** | **−363.800** | **2.480.800** | **6.606.000** |

En 2028 y 2029 los costos fijos suben por más marketing y, en 2029, un contador (detalle en
`../EMPRESA-SMAT/05-finanzas/proyeccion-3-anios.md`).

---

## Paso 3 · Veredicto financiero

Necesitamos **3 clientes por año** para cubrir todos los costos fijos, incluido el valor de nuestras propias horas,
también si el primero entra con el precio piloto. Siendo realistas, **sí es posible** conseguirlos en 2027: en la
zona hay alrededor de 495 industrias del tamaño de nuestro cliente (ver `04-dimension-del-mercado.md`), así que
necesitamos convencer a menos del 1 %, y el plan «Los primeros 10» apunta a 10 empresas con nombre propio para lograr
3 ventas. El riesgo no es el tamaño del mercado sino el **tiempo de venta**: una fábrica tarda en decidir y nosotros
somos dos personas. Por eso el primer año cierra **levemente abajo (−$363.800)**: no es plata que perdemos, sino
horas nuestras que valorizamos y no cobramos. Desde **2028**, con 10 clientes, los abonos solos ya pagan la estructura
(más de 6 activos) y el proyecto deja ganancia.

> **Cambio del 12/11/2026:** antes los valores estaban en dólares (USD 2.200 + USD 70 por mes y un punto de equilibrio
> de 2 clientes). El precio bajó a $950.000, y por eso ahora hacen falta 3 clientes por año.
