# Touch ID — Análisis de Mercado (TAM, SAM, SOM) y Punto de Equilibrio

*Informe elaborado para la consigna de dimensionamiento de mercado. Datos relevados en noviembre de 2026, con fuente citada en cada caso. Los valores en pesos usan los precios de Mercado Libre Argentina del 10/11/2026 y los costos del informe `costos_y_marco_legal.md`.*

**Pregunta de la consigna:** ¿el mercado objetivo (SOM) es suficiente para que el proyecto sobreviva o justifique su implementación, comparado con el Punto de Equilibrio?

**Respuesta corta:** **sí, pero con poco margen si se valoriza el trabajo del equipo.** El proyecto necesita **21 clientes** para cubrir todos sus costos (incluida la mano de obra) y el mercado objetivo realista del primer año es de **22 clientes**. Si no se cuenta la mano de obra, alcanzan **3 clientes** y el margen es muy amplio.

---

## 1. ¿Qué es un "cliente" de Touch ID?

Un **empleador (empresa, comercio o sucursal) con personal que necesita registrar su asistencia**: carnicerías, ferreterías, supermercados, talleres, consultorios, escuelas privadas. Cada cliente compra un módulo (ESP32 + sensor de huellas + pantalla + teclado + caja) y paga una cuota mensual de mantenimiento, según el modelo **Hardware + Mantenimiento** definido en el informe anterior.

## 2. Dimensionamiento del mercado

| Nivel | Definición aplicada a Touch ID | Cantidad | Fuente |
|---|---|---|---|
| **TAM** — Mercado Total | Todos los empleadores con trabajadores registrados en Argentina | **480.067** | SRT, julio 2026 (reportado por CEPA) |
| **SAM** — Mercado Servible | Empleadores de Alta Gracia, la ciudad donde el equipo puede instalar y dar soporte | **≈ 746** (estimado) | Cálculo propio con datos de la SRT y del Censo 2022 |
| **SOM** — Mercado Obtenible | 3 % del SAM en el primer año | **≈ 22** | Supuesto del equipo (ver 2.3) |

### 2.1 TAM: 480.067 empleadores

En julio de 2026 había 480.067 empleadores con trabajadores registrados en el país, según la Superintendencia de Riesgos del Trabajo (SRT). Es el universo completo: cualquier empleador podría necesitar controlar la asistencia de su personal.

### 2.2 SAM: ≈ 746 empleadores en Alta Gracia

No existe un dato oficial publicado de empleadores por ciudad, así que el SAM se estimó por proporción:

1. Empleadores registrados en la provincia de Córdoba: **47.440** (junio 2026, SRT/CEPA).
2. Población de la provincia de Córdoba: **3.840.905** habitantes (Censo 2022, definitivo).
3. Empleadores por cada 1.000 habitantes: 47.440 ÷ 3.840.905 × 1.000 = **12,35**.
4. Población de Alta Gracia: **60.373** habitantes (Censo 2022, definitivo).
5. Empleadores estimados en Alta Gracia: 60.373 × 12,35 ÷ 1.000 ≈ **746**.

*Limitación:* las ciudades chicas suelen tener menos empleadores por habitante que la capital provincial, por lo que el valor real podría ser algo menor. Además, la SRT solo cuenta empleadores con cobertura de ART. Por eso se aclara que es una **estimación**.

El SAM representa el 0,155 % del TAM. Si la agencia se expandiera a toda la provincia de Córdoba, el SAM pasaría a 47.440 empleadores.

### 2.3 SOM: ≈ 22 clientes en el primer año

Se tomó el **3 % del SAM** (746 × 0,03 = 22,4 → **22 clientes**), unos 2 clientes por mes. Es un valor prudente para un equipo pequeño que debe instalar, configurar y dar soporte a cada módulo, y que recién empieza a conocerse en la ciudad. Como referencia de sensibilidad:

| Participación sobre el SAM | Clientes en el primer año |
|---|---|
| 2 % (pesimista) | 15 |
| **3 % (base)** | **22** |
| 5 % (optimista) | 37 |

## 3. Punto de Equilibrio

> **Nota importante:** el informe de costos anterior detalló costos fijos y variables pero **no fijó un precio de venta**, por lo que el punto de equilibrio se recalcula acá a partir de esa misma tabla. Los precios de venta (marcados como *supuesto*) son una propuesta del equipo y pueden ajustarse; si el equipo ya calculó otro punto de equilibrio en clase, se reemplaza en la sección 4.

### 3.1 Costos fijos (informe `costos_y_marco_legal.md`)

| Concepto | Mensual | Anual |
|---|---|---|
| Dominio .com.ar ($8.500 por año) | $708 | $8.500 |
| Hosting VPS (USD 20) | $31.000 | $372.000 |
| Google Workspace (USD 7 por usuario) | $10.850 | $130.200 |
| Costos legales ($57.000, pago único del primer año) | $4.750 | $57.000 |
| **Subtotal sin mano de obra** | **$47.308** | **$567.700** |
| Mano de obra valorizada (9,33 hs semanales × $9.100 = $84.933 por semana) | $368.044 | $4.416.533 |
| **Total con mano de obra** | **$415.353** | **$4.984.233** |

### 3.2 Costo variable por cliente: el módulo físico

La versión actual del proyecto usa un **ESP32** (no un Arduino Uno como en el informe anterior), por lo que se actualiza el costo:

| Componente | Costo | Origen del valor |
|---|---|---|
| Placa ESP32 de 38 pines con USB-C | $16.990 | Mercado Libre Argentina, 10/11/2026 |
| Sensor de huellas AS608 (USD 30) | $46.500 | Informe de costos (a confirmar en Mercado Libre) |
| Pantalla LCD 16×2 con módulo I2C | $9.000 | Estimación propia, a confirmar |
| Teclado matricial 4×4 | $4.000 | Estimación propia, a confirmar |
| Caja impresa en 3D (PLA) | $3.500 | Estimación propia (unos 150 g de filamento) |
| Fuente y cable USB-C | $8.000 | Estimación propia, a confirmar |
| Tornillos, imanes y pasador | $2.000 | Estimación propia |
| **Costo del módulo** | **$89.990** | |

### 3.3 Precios de venta (supuesto) y margen por cliente

| Concepto | Valor |
|---|---|
| Precio del módulo instalado (pago único) | $130.000 |
| Cuota mensual de mantenimiento | $18.000 |
| Comisión de Mercado Pago sobre la cuota (6,49 % + IVA 21 % = 7,85 %) | −$1.414 |
| **Cuota mensual neta** | **$16.586** |
| Margen del módulo (130.000 − 89.990) | $40.010 |
| **Contribución de un cliente en su primer año** (40.010 + 12 × 16.586) | **≈ $239.048** |

### 3.4 Cálculo del punto de equilibrio

Fórmula: **clientes de equilibrio = costos fijos anuales ÷ contribución anual por cliente**

| Escenario | Costos fijos anuales | Cálculo | Punto de equilibrio |
|---|---|---|---|
| Sin valorizar la mano de obra | $567.700 | 567.700 ÷ 239.048 = 2,37 | **3 clientes** |
| Con mano de obra valorizada | $4.984.233 | 4.984.233 ÷ 239.048 = 20,85 | **21 clientes** |

## 4. Comparación: SOM contra Punto de Equilibrio

| Participación sobre el SAM | Clientes | Resultado anual sin mano de obra | Resultado anual con mano de obra |
|---|---|---|---|
| 2 % | 15 | +$3.018.020 | **−$1.398.513** (pérdida) |
| **3 % (base)** | **22** | **+$4.691.356** | **+$274.823** (justo sobre el equilibrio) |
| 5 % | 37 | +$8.277.076 | +$3.860.543 |

*Resultado = clientes × $239.048 − costos fijos anuales.*

Con el escenario base, los 22 clientes generan ingresos por $7.612.000 en el año (22 × [130.000 + 12 × 18.000]).

## 5. Conclusión

**El mercado objetivo es suficiente, pero apenas, si se cuenta el trabajo del equipo como un costo real.**

- **Sin valorizar horas**, el proyecto se paga con 3 clientes y el SOM es 7 veces mayor. La implementación se justifica con holgura.
- **Valorizando la mano de obra**, el SOM base (22) supera al punto de equilibrio (21) por solo un cliente. Con una participación del 2 % el proyecto daría pérdida; con el 5 % queda cómodo. La viabilidad depende de lograr al menos el 3 % de Alta Gracia en el primer año.
- **Segundo año:** el margen del módulo se cobra una sola vez, y después cada cliente aporta solo su cuota (≈ $199.000 al año). Con mano de obra valorizada el equilibrio recurrente exige unos **25 clientes activos**. Si el primer año deja 22 y el segundo suma otros 22, el proyecto llega a 44 y se sostiene.

**Recomendación:** implementar el proyecto. En un colegio o en un entorno donde el equipo no cobre por sus horas, el riesgo es mínimo. Si se pensara como negocio con sueldos, conviene ampliar el SAM a otras ciudades cercanas o a toda la provincia (47.440 empleadores) para no depender de capturar el 3 % de una sola ciudad.

## 6. Riesgos y limitaciones

- **Competencia con precio menor.** Un reloj biométrico de huella comercial (ProSoft, con huella, PIN y exportación por pendrive) cuesta **$63.049** en Mercado Libre. El módulo de Touch ID sale casi el doble, así que el valor diferencial debe estar en el servicio: almacenamiento y consulta de los registros, soporte, y el ingreso por teclado como respaldo si falla el sensor.
- **El mercado se achica.** Córdoba pasó de 52.389 empleadores (noviembre 2023) a 48.286 (enero 2026), una caída del 7,8 %. Hay menos empresas para captar que hace dos años.
- **SAM estimado**, no medido: puede variar con datos municipales reales (por ejemplo, el padrón comercial de la Municipalidad de Alta Gracia).
- **El 3 % de captura es un supuesto**, no un dato. Conviene validarlo con 5 a 10 entrevistas a comercios de la ciudad.
- **Los precios de varios componentes son estimaciones** (marcadas arriba) y los precios del sensor y de los demás componentes cambian semana a semana.
- El cálculo asume que cada cliente paga las 12 cuotas del año.

## Fuentes consultadas

- [Canal 26 — Cantidad de empresas con trabajadores registrados (480.067 empleadores, julio 2026, SRT)](https://www.canal26.com/economia/2026/10/10/la-cantidad-de-empresas-con-trabajadores-registrados-cayo-desde-que-asumio-milei-el-reporte-oficial/)
- [Diario de Cuyo — Informe CEPA sobre empleadores](https://www.diariodecuyo.com.ar/economia/un-informe-registro-mas-32-mil-empresas-empleadoras-menos-la-asuncion-milei-n6585551)
- [HoyDía — Córdoba perdió 26.949 empleos y 4.949 empleadores (47.440 empleadores, junio 2026)](https://hoydia.com.ar/economia/cordoba-perdio-26-949-empleos-y-4-949-empleadores-desde-fines-de-2023/)
- [CEPA — Informe laboral de Córdoba (52.389 a 48.286 empleadores; 14.097 en comercio)](https://centrocepa.com.ar/images/2026/04/dinamica/COR.pdf)
- [ElDoce — Censo 2022 definitivo: ciudades más pobladas de Córdoba (Alta Gracia: 60.373 habitantes)](https://eldoce.tv/actualidad/2024/07/12/difundieron-datos-definitivos-del-censo-2022-las-siete-ciudades-mas-pobladas-de-cordoba)
- [ElDoce — Censo 2022: población de Córdoba (3.840.905 habitantes)](https://eldoce.tv/sociedad/ano-medio-despues-censo-2022-confirmo-cuantos-habitantes-poblacion-cordoba_158575)
- [Mejores Compras — Reloj biométrico ProSoft en Mercado Libre ($63.049, 10/11/2026)](https://mejorescompras.com.ar/precio/MLA38504031--reloj-control-horario-biometrico-huella-pin-pendrive-prosoft-color-negro)
- [Mejores Compras — ESP32 de 38 pines con USB-C en Mercado Libre ($16.990, 10/11/2026)](https://mejorescompras.com.ar/precio/MLA42485623--nodemcu-esp32-38-pines-usb-c-wifi-bluetooth-placa-desarrollo-iot-compatible-arduino)
- Informe propio `costos_y_marco_legal.md` (costos fijos, mano de obra, comisión de Mercado Pago y precio del sensor)
