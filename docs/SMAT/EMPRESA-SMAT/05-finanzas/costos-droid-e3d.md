# Costo de fabricar e instalar un DROID-E3D

> **Estado:** completo (v1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 08/10/2026

**Para qué sirve:** cuánto cuesta construir, instalar y mantener una unidad. Es la base de los precios (`precios.md`) y de la proyección (`proyeccion-3-anios.md`).

> **Supuestos:** valores en **dólares (USD)** de referencia a octubre de 2026, porque los precios en pesos cambian muy rápido. Se convierten a pesos con el tipo de cambio del día de compra. Antes de comprar, **cotizar en al menos dos proveedores** y actualizar esta tabla.

## 1. Robot (una unidad)

| Componente | Cantidad | USD |
|---|---|---|
| ESP32 DevKit (control del robot) | 1 | 10 |
| Chasis de oruga con 2 motores DC con reductora | 1 | 80 |
| Driver de motores (TB6612 o L298N) | 1 | 6 |
| Batería de litio 12 V 5 Ah + protección (BMS) + cargador | 1 | 45 |
| Sensores ultrasónicos HC-SR04 (para no chocar) | 3 | 6 |
| Botón de parada de emergencia, buzzer y LED | 1 | 8 |
| Soporte de cámara y carcasa | 1 | 25 |
| Cables, borneras y fusible | 1 | 15 |
| Cámara (celular Android usado o cámara wifi) | 1 | 60 |
| **Subtotal robot** | | **255** |

## 2. Corte de máquina (una por zona)

| Componente | USD |
|---|---|
| ESP32 DevKit | 10 |
| Módulo relé de control | 5 |
| Contactor para la máquina (lo conecta un electricista matriculado) | 30 |
| Gabinete y fuente de 5 V | 25 |
| **Subtotal por máquina** | **70** |

Instalación típica: **2 máquinas** → USD 140.

## 3. Servidor de IA

| Opción | USD |
|---|---|
| PC usada con placa de video de entrada (corre YOLO en tiempo real) | 650 |
| Usar una PC del cliente que cumpla los requisitos | 0 |

Se presupuesta con PC propia (USD 650) para no depender del cliente.

## 4. Mano de obra por instalación

Valor hora de referencia: **USD 8** (desarrollador junior).

| Tarea | Horas | USD |
|---|---|---|
| Armado y prueba del robot | 12 | 96 |
| Instalación, configuración de zonas y ruta | 8 | 64 |
| Capacitación al encargado y a los empleados | 2 | 16 |
| **Subtotal** | **22** | **176** |

## 5. Total por instalación

| Concepto | USD |
|---|---|
| Robot | 255 |
| Corte de 2 máquinas | 140 |
| Servidor de IA | 650 |
| Mano de obra | 176 |
| **Subtotal** | **1.221** |
| Imprevistos y garantía (10 %) | 122 |
| **Costo total por instalación** | **≈ 1.343** |

## 6. Costo mensual por cliente (lo cubre el abono)

| Concepto | USD por mes |
|---|---|
| Soporte remoto (2 horas) | 16 |
| Visita de mantenimiento cada 3 meses (4 horas + traslado USD 20), prorrateada | 17 |
| **Total por cliente** | **≈ 33** |

> **Cambio del 08/10/2026:** el servidor ya no se prorratea por cliente. PythonAnywhere eliminó el plan de USD 5 y el
> más barato pasó a costar **USD 10 por mes** (un solo servidor para todos los clientes), así que ahora es un **costo
> fijo** de SMAT junto con el dominio, los registros legales y las horas de mantenimiento de la plataforma. Detalle con
> fuentes en `../../documentacion-comercial/01-viabilidad-comercial.md`.

## Cómo bajar costos más adelante

- Comprar componentes por cantidad (desde 5 robots).
- Placa de circuito propia en lugar de módulos sueltos.
- Correr la IA en una placa más chica cuando los modelos lo permitan.
