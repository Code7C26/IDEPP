# Costo de fabricar e instalar un DROID-E3D

> **Estado:** completo (v2) · **Responsable:** Tiziano · **Revisión:** Morena · **Actualizado:** 15/11/2026

**Para qué sirve:** cuánto cuesta construir, instalar y mantener una unidad. Es la base de los precios (`precios.md`) y de la proyección (`proyeccion-3-anios.md`).

> **Supuestos:** valores en **pesos**, relevados en tiendas argentinas el 12/11/2026 (precio de lista, sin envío).
> Referencia: **USD 1 = $1.570** (dólar oficial del Banco Nación, venta, 06/11/2026). Antes de comprar, cotizar en al
> menos dos tiendas: en Mercado Libre suele haber precios más bajos. Lo marcado «estimado» no tiene una cotización relevada.

## 1. Robot (una unidad)

Son las piezas que usamos en el robot nuevo (desde el 29/10/2026), confirmadas por Morena el 15/11/2026. Lo marcado «estimado» se calculó a partir de los precios relevados el 12/11.

| Componente | Cantidad | $ | Fuente |
|---|---|---|---|
| Placa ESP32-S3 N16R8 (control del robot) | 1 | 24.000 | HobbyTronica |
| ESP32-CAM con cámara y placa programadora | 1 | 30.000 | Mercado Libre |
| Driver de motores TB6612FNG | 1 | 10.000 | Unibot, Arsumo |
| Pantalla TFT ST7789 240x240 | 1 | 14.000 | TodoMicro |
| Controlador de servos PCA9685 + 7 servos (cabeza y brazos) | 1 + 7 | 38.000 | Estimado (antes: PCA9685 + 4 servos a $27.000, PatagoniaTec y Mercado Libre) |
| Audio: amplificador MAX98357A + parlante | 1 | 10.000 | Estimado |
| 2 motores con reductora y ruedas | 1 | 23.000 | TodoMicro |
| Batería: 2 celdas 18650, portapilas, protección (BMS) y cargador | 1 | 25.000 | Estimado (el cargador sale $7.950) |
| Reguladores de tensión (LM2596 y mini step-down) | 2 | 7.000 | TodoMicro |
| Cables, mini protoboard y borneras | 1 | 10.000 | Estimado |
| Cuerpo del WALL-E impreso en 3D (PLA) | 1 | 10.000 | PrintaLot |
| **Subtotal robot** | | **201.000** (≈ USD 128) | |

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
| Robot | 201.000 |
| Corte de 2 máquinas | 140.000 |
| Servidor de IA (PC de la fábrica) | 0 |
| Mano de obra | 176.000 |
| **Subtotal** | **517.000** |
| Imprevistos y garantía (10 %) | 51.700 |
| **Costo total por instalación** | **568.700** (≈ USD 362) |

Si la fábrica necesita la mini PC, el costo sube a $888.700.

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
>
> **Cambio del 15/11/2026:** la lista pasa a las piezas que realmente usamos. Salen los sensores de línea (el robot
> ahora se maneja a control remoto) y el buzzer (lo reemplaza el parlante); el audio es un amplificador MAX98357A en
> vez de un DFPlayer; los servos son 7 en vez de 4. El robot pasa de $200.000 a $201.000.
