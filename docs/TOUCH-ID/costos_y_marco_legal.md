# Touch ID — Costos Reales, Monetización y Marco Legal

*Informe elaborado para la consigna de costeo real y propiedad intelectual. Valores relevados en octubre de 2026, con fuente citada en cada caso. El tipo de cambio usado para convertir precios en dólares es el dólar blue de referencia ($1.550, 6/10/2026).*

## 1. Cuadro de Costos Reales y Monetización

### 1.1 Costos Fijos Reales

| Concepto | Valor | Periodicidad | Fuente |
|---|---|---|---|
| Dominio .com.ar (arancel oficial NIC Argentina) | $8.500 | Anual (alta, renovación y transferencia tienen el mismo valor) | Resolución 5/2024, Secretaría Legal y Técnica — confirmado vigente en nota de iProfesional (16/7/2026) |
| Hosting / servidor (VPS de entrada, 1 vCPU/1GB RAM) | USD 20 (≈ $31.000) | Mensual | Baires Host (proveedor con datacenter en Buenos Aires) |
| Herramientas de software con licencia paga (correo institucional, Google Workspace Business Starter) | USD 7 por usuario (≈ $10.850) | Mensual | Precio de lista público de Google Workspace |
| Costos legales (inscripciones iniciales — ver detalle en la Parte 2) | $57.000 aprox. (marca 1 clase + derecho de autor del software) | Pago único, primer año | Cálculo propio a partir de INPI y DNDA (fuentes en la Parte 2) |

*El resto del stack (Arduino IDE, Python, bibliotecas como Adafruit Fingerprint Library) es software libre y gratuito de origen — no es un costo "puesto en $0" arbitrariamente, es su condición real de licencia open source.*

### 1.2 Valorización de Horas/Hombre

Referencia de mercado para un Desarrollador Junior en Argentina (2026): sueldo de **$1.200.000 a $2.000.000 ARS mensuales** (Develop Argentina, con datos de SysArmy/OpenQube, junio 2026). Tomando el punto medio ($1.600.000) y una jornada de convenio informático de 176 hs/mes (8 hs × 22 días):

**Costo hora de referencia ≈ $9.100 ARS/hora**

*(Como cruce de control: el valor módulo del CPCE Córdoba para la categoría "informática o procesamiento de datos" es de $62.852 desde agosto de 2026 — se cita como referencia profesional alternativa, aunque no da directamente un valor hora sin conocer la tabla de multiplicadores por tarea.)*

| Concepto | Cálculo | Total |
|---|---|---|
| Dedicación semanal del equipo | 7 módulos escolares × 80 minutos = 560 minutos | 9,33 horas semanales |
| Costo hora | — | $9.100 |
| **Valorización semanal de mano de obra** | 9,33 hs × $9.100 | **$84.933** |

### 1.3 Costos Variables Reales

| Concepto | Valor estimado | Crece con | Fuente |
|---|---|---|---|
| Arduino Uno (compatible, placa CH340) | USD 13 (≈ $20.150) por unidad | Cada cliente/sucursal nueva | Precio internacional de placas compatibles (elecena.pl) — **confirmar precio puntual en Mercado Libre Argentina antes de entregar, cambia semana a semana** |
| Sensor de huella AS608 | USD 30 (≈ $46.500) por unidad | Cada cliente/sucursal nueva | Rango de precios internacionales de distribuidores (Fruugo, Probots) — **confirmar en Mercado Libre Argentina antes de entregar** |
| Comisión Mercado Pago (cobro de la mensualidad a clientes) | Entre 0,8% + IVA (dinero en cuenta) y 6,49% + IVA (tarjeta de crédito, acreditación inmediata) | Cada cobro mensual a cada cliente | iProfesional — "El ABC de Mercado Pago en Argentina" |
| Consumo por token en APIs de IA | No aplica | — | Touch ID no utiliza modelos de IA en su versión actual |

### 1.4 Modelo de Monetización elegido

**Hardware + Mantenimiento.**

Se vende el módulo (Arduino + sensor + caja) como un pago único por sucursal, y se cobra una cuota mensual baja por mantenimiento: actualizaciones del software, soporte técnico y almacenamiento de los registros de asistencia. Se eligió este modelo y no los otros tres porque:

- **Frente a SaaS puro:** el cliente (una pyme o comercio con varias sucursales) valora tener el hardware físico instalado y funcionando sin depender 100% de que el software esté online todo el tiempo — el registro de huellas y el matching ocurren en el propio Arduino, no en la nube.
- **Frente a Licencia Única:** sin un ingreso recurrente, no hay forma de financiar el soporte técnico ni las actualizaciones a mediano plazo.
- **Frente a Freemium/Transacción:** no tiene sentido cobrar por cada fichada de asistencia (sería una fricción rara para el cliente), y un modelo freemium no calza con un producto que necesita hardware físico entregado desde el día uno.

## 2. Investigación de Pasos Legales y Propiedad Intelectual

### ¿Qué trámites concretos debe realizar nuestra agencia en Argentina para formalizarse y proteger su software, hardware y nombre comercial?

### 2.1 Marca comercial — INPI

1. Búsqueda previa de antecedentes en el buscador de marcas del INPI (inpi.gob.ar) — **sin costo**, para confirmar que "Touch ID" no esté ya registrado.
2. Presentación de la solicitud online a través del propio sitio del INPI, indicando titular, tipo de marca (denominativa, figurativa o mixta) y la/s clase/s de Niza a proteger — probablemente Clase 9 (aparatos e instrumentos) y Clase 42 (servicios de software).
3. Pago del arancel oficial: **$40.569 por clase** (equivalente a 100 UMAPI, valor vigente al 15/9/2026 — el INPI actualiza este valor todos los meses según inflación).
4. Si se opta por contratar a un agente de la propiedad industrial matriculado para que gestione el trámite, el honorario profesional de mercado ronda los **$200.000 por clase** (opcional, no obligatorio).
5. Desde marzo de 2026 el INPI solo observa la marca por motivos de orden público; si nadie se opone dentro de los 30 días de publicada, el registro queda concedido automáticamente. Vigencia: 10 años, renovable indefinidamente.

*Fuentes: iProfesional (22/3/2026 y 3/4/2026), esderecho.com.ar (estudio de abogados de Córdoba, valores al 15/9/2026).*

### 2.2 Derecho de autor del software — DNDA

1. El trámite se inicia en la plataforma TAD (Trámites a Distancia) del Ministerio de Justicia, buscando "Inscripción de obra publicada – Software".
2. Si el software **todavía no está publicado/vendido**, existe una alternativa previa y opcional: el "Depósito en custodia de obra inédita", que cuesta **$1.400** y protege la autoría mientras se termina de desarrollar.
3. Una vez publicado (vendido o puesto en uso), se hace el registro definitivo: pago de **$3.800** al Fondo Cooperador Ley 23.412 DNDA-CESSI, más una tasa de **0,2% del costo del ejemplar** (es decir, del precio de venta del software).
4. Se debe enviar o presentar una copia del código fuente con sus carátulas en la sede de la DNDA (Moreno 1228, CABA) para que el trámite quede concluido.

*Fuente: argentina.gob.ar — trámites oficiales "Registrar un software puesto en conocimiento público" y "Registrar la autoría de un software inédito".*

### 2.3 Hardware físico original — Modelo de Utilidad / Diseño Industrial (INPI)

Para el módulo físico (la caja con el Arduino y el sensor) aplican dos protecciones distintas según qué se quiera proteger:

- **Modelo de Utilidad:** protege una mejora funcional o técnica del dispositivo (por ejemplo, una forma particular de montar el sensor o de organizar el cableado). Trámite ante el INPI, resolución en aproximadamente 2 años, vigencia de **10 años**.
- **Modelo o Diseño Industrial:** protege la apariencia estética de la caja (forma, líneas, aspecto visual), no su función.

Pasos para cualquiera de los dos:
1. Tener Clave Fiscal nivel 2 de AFIP y vincular el servicio "INPI" dentro de la cuenta de AFIP.
2. Ingresar al sistema del INPI (sección Patentes/Trámites) y cargar la solicitud con una descripción breve y las vistas/fotos del diseño.
3. El trámite no se considera recibido hasta pagar el arancel correspondiente, calculado también en UMAPI — como esta unidad se ajusta todos los meses, conviene chequear el valor vigente en inpi.gob.ar al momento exacto de iniciar el trámite. Como referencia general, un Modelo de Utilidad cuesta aproximadamente la mitad que una Patente de Invención completa.
4. Las novedades del expediente se comunican los miércoles por el Boletín de Notificaciones del INPI.

*Fuentes: argentina.gob.ar — "Registrar tu modelo de utilidad"; servidos.ar (explicación del sistema UMAPI vigente desde mayo 2026).*

## Fuentes consultadas

- NIC Argentina / Resolución 5/2024 — aranceles de dominios .ar
- Develop Argentina / SysArmy-OpenQube — sueldos de desarrolladores junior, 2026
- CPCE Córdoba — valor módulo de honorarios indicativos, agosto 2026
- iProfesional — comisiones de Mercado Pago; costo de registro de marcas INPI
- Baires Host — planes de VPS con datacenter en Argentina
- argentina.gob.ar — trámites de DNDA y de Modelo de Utilidad
- esderecho.com.ar — aranceles de marca y derecho de autor, valores al 15/9/2026
