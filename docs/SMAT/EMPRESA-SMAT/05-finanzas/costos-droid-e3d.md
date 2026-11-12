# Costo de fabricar e instalar un DROID-E3D

> **Estado:** completo (v2) · **Responsable:** Tiziano · **Revisión:** Morena · **Actualizado:** 12/11/2026

**Para qué sirve:** cuánto cuesta construir, instalar y mantener una unidad. Es la base de los precios (`precios.md`) y de la proyección (`proyeccion-3-anios.md`).

> **Supuestos:** valores en **pesos**, relevados en tiendas argentinas el 12/11/2026 (precio de lista, sin envío).
> Referencia: **USD 1 = $1.570** (dólar oficial del Banco Nación, venta, 06/11/2026). Antes de comprar, cotizar en al
> menos dos tiendas: en Mercado Libre suele haber precios más bajos. Lo marcado «estimado» no tiene una cotización relevada.

## 1. Robot (una unidad)

Son las piezas del robot nuevo (desde el 29/10/2026: ruedas y ESP32-S3). La lista definitiva la confirma Morena.

| Componente | Cantidad | $ | Fuente |
|---|---|---|---|
| Placa ESP32-S3 N16R8 (control del robot) | 1 | 24.000 | HobbyTronica |
| ESP32-CAM con cámara y placa programadora | 1 | 30.000 | Mercado Libre |
| Driver de motores TB6612FNG | 1 | 10.000 | Unibot, Arsumo |
| Pantalla TFT ST7789 240x240 | 1 | 14.000 | TodoMicro |
| Controlador de servos PCA9685 + 4 servos SG90 | 1 + 4 | 27.000 | PatagoniaTec, Mercado Libre |
| Audio: DFPlayer Mini + parlante | 1 | 10.000 | HobbyTronica |
| Chasis 2WD con 2 motores con reductora, ruedas y rueda loca | 1 | 23.000 | TodoMicro |
| Batería: 2 celdas 18650, portapilas, protección (BMS) y cargador | 1 | 25.000 | Estimado (el cargador sale $7.950) |
| Reguladores de tensión (step-down) | 2 | 7.000 | TodoMicro |
| Sensores de línea TCRT5000 (marcas de cada zona) | 2 | 5.000 | TodoMicro |
| Buzzer, LED, botón de parada de emergencia, cables y borneras | 1 | 15.000 | Estimado |
| Carcasa impresa en 3D (½ kg de PLA) | 1 | 10.000 | PrintaLot |
| **Subtotal robot** | | **200.000** (≈ USD 127) | |

## 2. Corte de máquina (una por zona)

| Componente | $ | Fuente |
|---|---|---|
| Placa ESP32 | 13.000 | HobbyTronica |
| Módulo relé 5 V 10 A | 4.000 | TodoMicro |
| Contactor tripolar 9 A, bobina 220 V (lo conecta un electricista matriculado) | 26.000 | Chint (Santiago Kohn), Sica |
| Fuente de 5 V 2 A | 10.000 | Mercado Libre, Qualis |
| Gabinete plástico | 12.000 | Estimado |
| Cables y borneras | 5.000 | Estimado |
| **Subtotal por máquina** | **70.000** (≈ USD 45) | |

Instalación típica: **2 máquinas** → $140.000.

## 3. Servidor de IA

| Opción | $ |
|---|---|
| Usar una PC de la fábrica (procesador i5 o similar, 8 GB de RAM) | 0 |
| Mini PC usada (i5, 8 GB), si la fábrica no tiene una | 320.000 (en Mercado Libre, de $228.000 a $420.000) |

El precio base usa una PC de la fábrica. La IA usa el modelo chico de YOLO, que corre sin placa de video: procesa unas
pocas imágenes por segundo, y alcanza porque el robot se mueve despacio. **A confirmar por Morena** con la PC de la
demo. Si hace falta la mini PC, se cobra aparte ($350.000, `precios.md`).

## 4. Mano de obra por instalación

Valor hora de referencia: **$8.000** (justificado en `../../documentacion-comercial/01-viabilidad-comercial.md`, sección 3.3).

| Tarea | Horas | $ |
|---|---|---|
| Armado y prueba del robot | 12 | 96.000 |
| Instalación, configuración de zonas y ruta | 8 | 64.000 |
| Capacitación al encargado y a los empleados | 2 | 16.000 |
| **Subtotal** | **22** | **176.000** (≈ USD 112) |

## 5. Total por instalación

| Concepto | $ |
|---|---|
| Robot | 200.000 |
| Corte de 2 máquinas | 140.000 |
| Servidor de IA (PC de la fábrica) | 0 |
| Mano de obra | 176.000 |
| **Subtotal** | **516.000** |
| Imprevistos y garantía (10 %) | 51.600 |
| **Costo total por instalación** | **567.600** (≈ USD 362) |

Si la fábrica necesita la mini PC, el costo sube a $887.600.

## 6. Costo mensual por cliente (lo cubre el abono)

| Concepto | $ por mes |
|---|---|
| Soporte remoto (2 horas) | 16.000 |
| Visita de mantenimiento cada 3 meses (4 horas + traslado $15.000), prorrateada | 15.700 |
| **Total por cliente** | **≈ 32.000** (≈ USD 20) |

## 7. Costos fijos

El servidor de la plataforma (Render), el dominio, los registros legales, las horas de mantenimiento de la plataforma y
el marketing no dependen de la cantidad de clientes: suman **≈ $121.000 por mes**. Detalle con fuentes en
`../../documentacion-comercial/01-viabilidad-comercial.md`, sección 3.1.

> **Cambio del 12/11/2026:** se pasa a pesos y se rehace con las piezas del robot nuevo. Antes el costo era de
> USD 1.343 por instalación: incluía una PC con placa de video de USD 650 y el robot de oruga.
