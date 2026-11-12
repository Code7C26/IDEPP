# Proyección a 3 años (2027 · 2028 · 2029)

> **Estado:** completo (v2) · **Responsable:** Tiziano · **Revisión:** Morena · **Actualizado:** 12/11/2026

**Para qué sirve:** estimación de ventas, gastos y resultado. Es una estimación: los supuestos están escritos para poder defenderla.

## Supuestos

| Supuesto | Valor | De dónde sale |
|---|---|---|
| Clientes nuevos por año | 3 (2027) · 7 (2028) · 15 (2029) | Llegar a 25 fábricas en 2029 (visión) |
| Plan | Todos en Plan Compra | `precios.md` |
| Pago único | $950.000 (el primer cliente, piloto: $475.000) | `precios.md` |
| Abono | $55.000 por mes | `precios.md` |
| Un cliente nuevo paga abono la mitad de su primer año | Promedio de altas a lo largo del año | — |
| Costo por instalación | $567.600 (la IA corre en una PC de la fábrica) | `costos-droid-e3d.md` |
| Costo mensual por cliente | $32.000 (soporte y visitas) | `costos-droid-e3d.md` |
| Trabajo de los socios | A $8.000 por hora: en cada instalación y **10 horas por mes de mantenimiento de la plataforma** ($960.000 por año) | `costos-droid-e3d.md` y `../../documentacion-comercial/01-viabilidad-comercial.md` |
| Todos los valores | Pesos de noviembre de 2026, sin inflación ni impuestos | Simplificación: precios y costos se actualizan juntos cada 3 meses |

## Ingresos

| $ | 2027 | 2028 | 2029 |
|---|---|---|---|
| Clientes nuevos | 3 | 7 | 15 |
| Clientes totales | 3 | 10 | 25 |
| Pagos únicos | 2.375.000 | 6.650.000 | 14.250.000 |
| Abonos | 990.000 | 4.290.000 | 11.550.000 |
| **Total ingresos** | **3.365.000** | **10.940.000** | **25.800.000** |

Cálculo de abonos: 2027 = 3 × 55.000 × 6 · 2028 = 3 × 55.000 × 12 + 7 × 55.000 × 6 · 2029 = 10 × 55.000 × 12 + 15 × 55.000 × 6.

## Gastos

| $ | 2027 | 2028 | 2029 |
|---|---|---|---|
| Instalaciones (clientes nuevos × 567.600) | 1.702.800 | 3.973.200 | 8.514.000 |
| Servicio mensual (meses-cliente × 32.000) | 576.000 | 2.496.000 | 6.720.000 |
| Fijos (servidor, dominio, registros INPI y DNDA) | 190.000 | 230.000 | 300.000 |
| Mantenimiento de la plataforma (10 h por mes × $8.000) | 960.000 | 960.000 | 960.000 |
| Marketing (demos, traslados, ferias) | 300.000 | 800.000 | 1.500.000 |
| Contador | — | — | 1.200.000 |
| **Total gastos** | **3.728.800** | **8.459.200** | **19.194.000** |

Meses-cliente: 2027 = 18 · 2028 = 36 + 42 = 78 · 2029 = 120 + 90 = 210.

## Resultado

| $ | 2027 | 2028 | 2029 |
|---|---|---|---|
| Ingresos | 3.365.000 | 10.940.000 | 25.800.000 |
| Gastos | 3.728.800 | 8.459.200 | 19.194.000 |
| **Resultado** | **−363.800** | **2.480.800** | **6.606.000** |
| Fondo de reserva (20 % si hay ganancia) | — | 496.160 | 1.321.200 |
| Resultado acumulado | −363.800 | 2.117.000 | 8.723.000 |

## Punto de equilibrio

Cálculo completo en `../../documentacion-comercial/03-punto-de-equilibrio.md`. En resumen:

- Costos fijos ≈ **$1.450.000 por año**, contando 10 horas por mes de nuestro trabajo en la plataforma.
- Cada cliente deja en su primer año **$658.400** (1.610.000 − 951.600): hacen falta **3 clientes por año**, también
  si el primero es el piloto. Con **6 clientes activos**, los abonos solos pagan la estructura.
- **2027 cierra en −$363.800:** no es dinero que sale, sino el valor de nuestras horas que no cobramos. La inversión
  inicial (≈ $590.000, `inversion-inicial.md`) se recupera en **2028**.
- El riesgo real es **no conseguir clientes**, no el margen.

## Qué podría salir mal

| Riesgo | Efecto | Qué hacemos |
|---|---|---|
| Se consiguen la mitad de los clientes | El resultado de 2028 baja a menos de la mitad | Ofrecer el precio piloto a más fábricas; vender junto con Touch ID |
| Suben las piezas (inflación o dólar) | Baja el margen por instalación | Actualizar precios cada 3 meses; comprar las piezas al cerrar cada venta |
| La fábrica no tiene una PC que sirva para la IA | Hay que sumar la mini PC | Se cobra aparte ($350.000), así que no afecta el margen |
| Más visitas de soporte de las previstas | Sube el costo mensual | Mejorar la documentación y el soporte remoto |

> **Cambio del 12/11/2026:** se pasa a pesos con los precios nuevos. El mantenimiento de la plataforma baja de 20 a
> 10 horas por mes, porque la web ya está terminada.
