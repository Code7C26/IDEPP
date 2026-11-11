# Proyección a 3 años (2027 · 2028 · 2029)

> **Estado:** completo (v1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 08/10/2026

**Para qué sirve:** estimación de ventas, gastos y resultado. Es una estimación: los supuestos están escritos para poder defenderla.

## Supuestos

| Supuesto | Valor | De dónde sale |
|---|---|---|
| Clientes nuevos por año | 3 (2027) · 7 (2028) · 15 (2029) | Llegar a 25 fábricas en 2029 (visión) |
| Plan | Todos en Plan Compra | `precios.md` |
| Pago único | USD 2.200 (el primer cliente, piloto: USD 1.100) | `precios.md` |
| Abono | USD 70 por mes | `precios.md` |
| Un cliente nuevo paga abono la mitad de su primer año | Promedio de altas a lo largo del año | — |
| Costo por instalación | USD 1.343 | `costos-droid-e3d.md` |
| Costo mensual por cliente | USD 33 (soporte y visitas) | `costos-droid-e3d.md` |
| Trabajo de los socios | A USD 8 por hora: en cada instalación y **20 horas por mes de mantenimiento de la plataforma** (USD 1.920 por año) | `costos-droid-e3d.md` y `../../documentacion-comercial/01-viabilidad-comercial.md` |
| Todos los valores | USD, sin inflación ni impuestos | Simplificación |

## Ingresos

| | 2027 | 2028 | 2029 |
|---|---|---|---|
| Clientes nuevos | 3 | 7 | 15 |
| Clientes totales | 3 | 10 | 25 |
| Pagos únicos | 5.500 | 15.400 | 33.000 |
| Abonos | 1.260 | 5.460 | 14.700 |
| **Total ingresos** | **6.760** | **20.860** | **47.700** |

Cálculo de abonos: 2027 = 3 × 70 × 6 · 2028 = 3 × 70 × 12 + 7 × 70 × 6 · 2029 = 10 × 70 × 12 + 15 × 70 × 6.

## Gastos

| | 2027 | 2028 | 2029 |
|---|---|---|---|
| Instalaciones (clientes nuevos × 1.343) | 4.029 | 9.401 | 20.145 |
| Servicio mensual (meses-cliente × 33) | 594 | 2.574 | 6.930 |
| Fijos (servidor, dominio, registros INPI y DNDA, cuentas) | 160 | 200 | 300 |
| Mantenimiento de la plataforma (20 h por mes × USD 8) | 1.920 | 1.920 | 1.920 |
| Marketing (demos, traslados, ferias) | 300 | 1.000 | 2.000 |
| Contador | — | — | 1.200 |
| **Total gastos** | **7.003** | **15.095** | **32.495** |

Meses-cliente: 2027 = 18 · 2028 = 36 + 42 = 78 · 2029 = 120 + 90 = 210.

## Resultado

| | 2027 | 2028 | 2029 |
|---|---|---|---|
| Ingresos | 6.760 | 20.860 | 47.700 |
| Gastos | 7.003 | 15.095 | 32.495 |
| **Resultado** | **−243** | **5.765** | **15.205** |
| Fondo de reserva (20 % si hay ganancia) | — | 1.153 | 3.041 |
| Resultado acumulado | −243 | 5.522 | 20.727 |

## Punto de equilibrio

Cálculo completo en `../../documentacion-comercial/03-punto-de-equilibrio.md`. En resumen:

- Costos fijos ≈ **USD 2.380 por año**, contando 20 horas por mes de nuestro trabajo en la plataforma.
- Cada cliente deja en su primer año **USD 1.301** (3.040 − 1.739): hacen falta **2 clientes por año**, o **3** si el
  primero es el piloto. Con **6 clientes activos**, los abonos solos pagan la estructura.
- **2027 cierra en −USD 243:** no es dinero que sale, sino el valor de nuestras horas que no cobramos. La inversión
  inicial (USD 740, `inversion-inicial.md`) se recupera en **2028**.
- El riesgo real es **no conseguir clientes**, no el margen.

## Qué podría salir mal

| Riesgo | Efecto | Qué hacemos |
|---|---|---|
| Se consiguen la mitad de los clientes | El resultado de 2028 baja a la mitad aproximadamente | Ofrecer el precio piloto a más fábricas; vender junto con Touch ID |
| Suben los componentes (dólar) | Baja el margen por instalación | Precios en USD; revisar cada 6 meses |
| Más visitas de soporte de las previstas | Sube el costo mensual | Mejorar la documentación y el soporte remoto |
