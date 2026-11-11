# Finanzas de la agencia: el punto de equilibrio · DROID-E3D

> **Materia:** Emprendimiento · **Profesora:** Tamara Piccinni · **Agencia:** SMAT (división de TOUCH)
> **Equipo:** Toro · Morena · **Actualizado:** 08/10/2026 · Valores en dólares (USD 1 = $1.550)

**Pregunta:** ¿cuántos clientes necesitamos para sobrevivir?

**Fórmula:** Punto de equilibrio = Costos fijos totales ÷ (Precio de venta − Costo variable unitario)

---

## Paso 1 · Precio real

**Plan Compra: USD 2.200 de pago único + USD 70 por mes.** No es un número inventado:

| Referencia | Valor | Qué nos dice |
|---|---|---|
| Lo que nos cuesta instalar | USD 1.343 por planta | El precio tiene que dejar margen sobre esto: 2.200 deja USD 857 (39 %) |
| Lo que le ahorramos al cliente | Un técnico que controle el EPP: ≈ USD 690 por mes sin cargas sociales (lifeindexed.com, 2026) | El primer año de DROID-E3D (USD 3.040) equivale a 4 meses y medio de esa persona, que además cubre un solo turno |
| La competencia | Intenseye y Protex AI venden por cotización a multinacionales; no publican precios | Nuestra PyME objetivo no tiene una opción a su alcance: el precio apunta a ella |

Como el modelo combina un pago único y un abono mensual, el cálculo se hace **anual**, tomando lo que deja un
cliente en su primer año.

---

## Paso 2 · Cálculo de supervivencia

### Las tres variables

| Variable | Cálculo | USD |
|---|---|---|
| **Costos fijos totales (CF)** por año | Servidor 120 + dominio 6 + marca INPI 26 + software DNDA 7 + horas de mantenimiento de la plataforma 1.920 (20 h × USD 8 × 12) + marketing 300 | **2.379 ≈ 2.380** |
| **Precio de venta (PV)** del primer año | 2.200 + 12 × 70 | **3.040** |
| **Costo variable unitario (CVU)** del primer año | Instalación 1.343 + 12 × 33 (soporte y visitas) | **1.739** |

Detalle de cada costo, con su fuente: `01-viabilidad-comercial.md`, sección 3.

### Resultado

> **Punto de equilibrio = 2.380 ÷ (3.040 − 1.739) = 2.380 ÷ 1.301 = 1,83 → 2 clientes por año**

### Dos miradas más

| Pregunta | Cálculo | Resultado |
|---|---|---|
| ¿Cuántos clientes con abono hacen falta para que **los abonos solos** paguen los costos fijos, sin depender de vender robots? | 198 por mes ÷ (70 − 33) = 5,4 | **6 clientes activos** |
| ¿Y si el primero es el **cliente piloto** (paga USD 1.100 en lugar de 2.200)? | Su margen del primer año: 1.100 + 840 − 1.739 = **201** · Faltan 2.380 − 201 = 2.179 ÷ 1.301 = 1,7 | **3 clientes** (el piloto + 2 a precio completo) |

### Cómo se ve en el tiempo

Los clientes no entran todos el 1 de enero: en promedio pagan medio año de abono el primer año. Con la meta de la
proyección (3 clientes en 2027, uno de ellos piloto):

| | 2027 | 2028 | 2029 |
|---|---|---|---|
| Clientes nuevos / totales | 3 / 3 | 7 / 10 | 15 / 25 |
| Ingresos | 6.760 | 20.860 | 47.700 |
| Costos variables (instalaciones + soporte) | 4.623 | 11.975 | 27.075 |
| Costos fijos (incluye nuestras horas) | 2.380 | 3.120 | 5.420 |
| **Resultado** | **−243** | **5.765** | **15.205** |

En 2028 y 2029 los costos fijos suben por más marketing y, en 2029, un contador (detalle en
`../EMPRESA-SMAT/05-finanzas/proyeccion-3-anios.md`).

---

## Paso 3 · Veredicto financiero

Necesitamos **2 clientes por año** a precio completo para cubrir todos los costos fijos, incluido el valor de
nuestras propias horas; si el primero entra con el precio piloto, hacen falta **3**. Siendo realistas, **sí es
posible** conseguirlos en 2027: en la zona hay alrededor de 495 industrias del tamaño de nuestro cliente
(ver `04-dimension-del-mercado.md`), así que necesitamos convencer a menos del 1 %, y el plan «Los primeros 10»
apunta a 10 empresas con nombre propio para lograr 3 ventas. El riesgo no es el tamaño del mercado sino el
**tiempo de venta**: una fábrica tarda en decidir y nosotros somos dos personas. Por eso el primer año cierra
**levemente abajo (−USD 243)**: no es plata que perdemos, sino horas nuestras que valorizamos y no cobramos. Desde
**2028**, con 10 clientes, los abonos solos ya pagan la estructura (más de 6 activos) y el proyecto deja ganancia.
