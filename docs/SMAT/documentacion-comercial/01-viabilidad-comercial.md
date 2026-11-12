# Modelo de negocio y viabilidad comercial · DROID-E3D

> **Materia:** Emprendimiento (en conjunto con FAT) · **Profesora:** Tamara Piccinni · **Agencia:** IDEPP
> **Equipo:** Tiziano (software y web) · Morena (hardware e IA) · **Actualizado:** 12/11/2026

**Valores:** en pesos, relevados en tiendas argentinas en noviembre de 2026, con la fuente de cada uno. Como
referencia se usa **USD 1 = $1.570** (dólar oficial del Banco Nación, venta, 06/11/2026). Los precios se actualizan
cada 3 meses, porque en pesos cambian seguido.

---

## 1. Lo técnicamente factible frente a lo comercialmente viable

| Pregunta | Respuesta para DROID-E3D |
|---|---|
| **FAT** · ¿Se puede desarrollar? | Sí. La plataforma web (Flask + React) ya funciona con 124 pruebas automáticas de la API y 133 en el navegador; la IA de Morena (YOLO + reconocimiento facial) ya manda alertas con foto a la web; el robot y el corte de máquina se prueban con un simulador hasta tener el hardware final. |
| **Emprendimiento** · ¿Conviene? | Sí. Cada instalación deja $382.400 de margen y cada cliente $23.000 por mes; con **3 clientes por año** se cubren los costos fijos (ver `03-punto-de-equilibrio.md`), y en la zona hay alrededor de 495 industrias que podrían comprarlo (ver `04-dimension-del-mercado.md`). |

---

## 2. Fase 1 · Cuadro de diagnóstico comercial de las mejoras

Antes de sumar una función, la pasamos por este filtro. Analizamos las cuatro mejoras más importantes del proyecto.

### Mejora A · Detección de EPP con IA y corte automático de la máquina de la zona

| Ítem | Detalle |
|---|---|
| **Optimización técnica** | Una cámara en el robot detecta con YOLO a quien trabaja sin casco, guantes, lentes o chaleco; la web registra la alerta y un ESP32 con relé corta **solo** la máquina de esa zona hasta que el encargado la reactive. |
| **Plazo de desarrollo** | ≈ 90 horas: plataforma y API para la IA y las máquinas (≈ 45 h, Tiziano), servidor de IA (≈ 35 h, Morena), corte de máquina con ESP32 (≈ 10 h). |
| **Insumos adicionales** | Una PC de la fábrica para la IA (si no tiene, una mini PC usada: $320.000); por máquina: ESP32 + relé + contactor + gabinete ($70.000); la cámara del robot es una ESP32-CAM ($30.000). Los modelos de IA son gratuitos (ver licencia en la sección 5). |
| **Repercusión en la propuesta de valor** | **[X] Elevada** · [ ] Moderada · [ ] Reducida |
| **Por qué** | Es el núcleo del producto: es lo que el cliente paga. Sin detección automática y sin parada de máquina, DROID-E3D sería una cámara más. Justifica el precio de $950.000. |
| **Resolución estratégica** | **Se valida.** Está en el MVP y ya funciona de punta a punta (IA → web → orden de parada). |

### Mejora B · Reconocimiento facial y foto de evidencia en cada alerta

| Ítem | Detalle |
|---|---|
| **Optimización técnica** | La IA reconoce de quién es la cara (con fotos cargadas con su consentimiento) y adjunta la foto del momento a la alerta. |
| **Plazo de desarrollo** | ≈ 25 horas (fotos y permisos en la plataforma ≈ 20 h; reconocimiento con modelos gratuitos de OpenCV ≈ 5 h). |
| **Insumos adicionales** | Ninguno pago: las fotos pesan ≈ 100 KB y entran en el hosting actual. Requiere el consentimiento de cada empleado (Ley 25.326). |
| **Repercusión en la propuesta de valor** | [ ] Elevada · **[X] Moderada** · [ ] Reducida |
| **Por qué** | Le da al registro el «quién» que pide la ART y permite que cada empleado vea su propio cumplimiento. Pero el cliente compraría igual con alertas sin nombre: no justifica cobrar más. |
| **Resolución estratégica** | **Se valida** porque su costo es bajo y ya está hecha, con una condición: se puede desactivar en las plantas donde los empleados no den su consentimiento. |

### Mejora C · Notificaciones al celular (push)

| Ítem | Detalle |
|---|---|
| **Optimización técnica** | Aviso en el celular del encargado apenas hay una alerta, aunque tenga la web cerrada. |
| **Plazo de desarrollo** | ≈ 16 horas. |
| **Insumos adicionales** | Ninguno pago (Web Push es un estándar gratuito); necesita HTTPS, que ya da el hosting. |
| **Repercusión en la propuesta de valor** | [ ] Elevada · **[X] Moderada** · [ ] Reducida |
| **Por qué** | Acelera la respuesta y fideliza, pero el panel ya muestra las alertas en segundos. |
| **Resolución estratégica** | **Se valida para después del núcleo** (Fase 7 del plan, noviembre de 2026): no frena la entrega del MVP. |

### Mejora D · Rediseño visual y animaciones del mapa

| Ítem | Detalle |
|---|---|
| **Optimización técnica** | Estilo más profesional de la web, mapa con íconos y robot animado. |
| **Plazo de desarrollo** | ≈ 12 horas. |
| **Insumos adicionales** | Ninguno. |
| **Repercusión en la propuesta de valor** | [ ] Elevada · [ ] Moderada · **[X] Reducida** |
| **Por qué** | Ayuda en la demo, pero ningún cliente compra por una animación. |
| **Resolución estratégica** | **Se hizo solo porque fue corto** (una jornada) y mejora la demostración. Regla para lo que sigue: nada estético antes de cerrar las Fases 7 a 9. |

---

## 3. Fase 2 · Estructura de costos y precios

### 3.1 Costos fijos (se pagan aunque no vendamos)

| Concepto | Valor real | Por mes ($) | Fuente |
|---|---|---|---|
| Servidor de la plataforma y la web (Render, plan Starter, siempre encendido) | USD 7 por mes | 11.000 | [Precios de Render](https://render.com/pricing) |
| Base de datos y fotos (Supabase, plan gratuito) | $0 | 0 | Decisión 007 (`src/SMAT/docs/decisiones/`) |
| Dominio `droide3d.com.ar` | $8.500 por año | 710 | NIC Argentina, Resolución 5/2024 (relevado por el equipo de TOUCH-ID, 10/2026) |
| **Legal:** marca «DROID-E3D» en el INPI, clase 9 | $40.569 (100 UMAPI), pago único por 10 años | 3.380 (prorrateado en el 1.er año) | Valor al 15/09/2026 (esderecho.com.ar e iProfesional, relevado por el equipo de TOUCH-ID) |
| **Legal:** registro del software en la DNDA | $3.800 + 0,2 % del precio ($1.900) = $5.700 | 475 (prorrateado en el 1.er año) | argentina.gob.ar, trámite «Registrar un software puesto en conocimiento público» |
| Horas de mantenimiento de la plataforma (10 h por mes × $8.000) | $80.000 por mes | 80.000 | Valor hora: ver 3.3 |
| Marketing base (demos, traslados, impresiones) | $300.000 por año | 25.000 | `../EMPRESA-SMAT/06-comercial/plan-de-marketing.md` |
| **Total de costos fijos** | | **≈ 121.000 por mes · ≈ $1.450.000 por año** | |

### 3.2 Costos variables (crecen con cada cliente)

| Concepto | $ | Cuándo | Detalle |
|---|---|---|---|
| Robot (ESP32-S3, ESP32-CAM, chasis con ruedas, batería, servos, pantalla) | 200.000 | Por instalación | Pieza por pieza en `../EMPRESA-SMAT/05-finanzas/costos-droid-e3d.md` (HobbyTronica, TodoMicro, PatagoniaTec, Unibot y Mercado Libre, 11/2026) |
| Corte de 2 máquinas (ESP32 + relé + contactor + gabinete) | 140.000 | Por instalación | $70.000 por máquina; cada máquina extra se cobra $120.000 |
| Servidor de IA | 0 | Por instalación | Corre en una PC de la fábrica; si no tiene, una mini PC usada ($320.000) que se cobra aparte ($350.000) |
| Armado, instalación y capacitación (22 h × $8.000) | 176.000 | Por instalación | |
| Imprevistos y garantía (10 %) | 51.600 | Por instalación | |
| **Costo por instalación** | **567.600** | | Detalle en `../EMPRESA-SMAT/05-finanzas/costos-droid-e3d.md` |
| Soporte remoto (2 h por mes) | 16.000 | Por cliente y por mes | |
| Visita de mantenimiento cada 3 meses (4 h + traslado), prorrateada | 15.700 | Por cliente y por mes | |
| **Costo mensual por cliente** | **≈ 32.000** | | |
| Comisión de cobro | 0 | Por cobro | El abono se cobra por transferencia; si se usa Mercado Pago, suma 0,8 % + IVA (iProfesional) |

> **No usamos APIs pagas de IA:** el modelo corre en la PC del servidor de IA, así que no hay costo por consulta
> que crezca con el uso. Lo que sí crece es el hardware: un robot por planta y un corte por máquina.

### 3.3 Valor de nuestra hora técnica

Aunque hoy no nos pagamos sueldo, el tiempo se cuenta. Un desarrollador junior en Argentina cobra entre
**$1.200.000 y $2.000.000 por mes** (Develop Argentina con datos de SysArmy/OpenQube, junio de 2026); la mediana es
de **$1.538.500** (Teclab, 2026), unos **$8.700 la hora** (176 h por mes). Como todavía somos estudiantes, usamos
**$8.000 por hora** (≈ USD 5), el mismo valor de todos nuestros costos.

### 3.4 Precio y estrategia comercial elegida: **Venta del equipo + abono mensual**

| Plan | Precio | Qué incluye |
|---|---|---|
| **Plan Compra** (el que se ofrece hoy) | **$950.000** pago único **+ $55.000 por mes** | Robot, corte de 2 máquinas, instalación y capacitación (la IA corre en una PC de la fábrica; si no tiene, la mini PC suma $350.000); el abono cubre plataforma, soporte, actualizaciones y una visita cada 3 meses |
| Plan Servicio (alquiler, desde 2028) | $120.000 por mes, mínimo 12 meses | Todo incluido, el equipo es de IDEPP |

**Por qué este modelo y no otro:**

- **Frente a SaaS puro:** DROID-E3D necesita un robot y cortes de máquina físicos. Una PyME prefiere comprar el
  equipo una vez; nosotros recuperamos el costo del hardware en la venta y no financiamos equipos.
- **Frente a licencia única:** un sistema de seguridad necesita soporte y visitas. Sin un ingreso mensual no
  podríamos pagar ese trabajo ni las actualizaciones.
- **Frente a freemium o cobro por uso:** cobrar por cada alerta haría que al cliente le «convenga» tener menos
  alertas registradas, lo contrario de lo que buscamos; y una versión gratis no tiene sentido con hardware.

**Cómo se fijó el precio:** el primer año del Plan Compra ($950.000 + 12 × 55.000 = **$1.610.000**) equivale a
**un mes y medio de sueldo** de un técnico (≈ $1.070.000 por mes en 2026 según lifeindexed.com, sin
contar cargas sociales). Una persona controla un turno; el robot controla todos, y desde el segundo año cuesta
solo el abono ($660.000 por año). Las plataformas grandes de detección de EPP (Intenseye, Protex AI) no publican
precios: venden por cotización a multinacionales; nuestro precio apunta a la PyME que ellas no atienden.

---

## 4. Viabilidad en números (resumen)

| Indicador | Valor | Dónde está el cálculo |
|---|---|---|
| Margen por instalación | $950.000 − 567.600 = **$382.400** (40 %) | 3.2 |
| Margen mensual por cliente | $55.000 − 32.000 = **$23.000** (42 %) | 3.2 |
| Punto de equilibrio | **3 clientes por año** (Plan Compra) · **6 clientes activos** para que los abonos solos paguen los fijos | `03-punto-de-equilibrio.md` |
| Mercado de la zona (SAM) | ≈ **495 industrias** | `04-dimension-del-mercado.md` |
| Meta del primer año (SOM 2027) | **3 clientes** (0,6 % de la zona) | `04-dimension-del-mercado.md` |

---

## 5. Pasos legales y propiedad intelectual

| Qué se protege | Dónde | Pasos | Costo | Cuándo |
|---|---|---|---|---|
| **Marca** «DROID-E3D» (y después «IDEPP») | **INPI** | 1) Búsqueda de antecedentes (gratis). 2) Solicitud online con clave fiscal: marca mixta (nombre + logo), **clase 9** (aparatos y software) y luego **clase 42** (servicios de software). 3) Pago del arancel. 4) Publicación: si nadie se opone en 30 días, queda concedida. Dura 10 años y se renueva. | $40.569 por clase | Antes del primer cliente |
| **Software** (plataforma web) | **DNDA** (por TAD) | El software **no se patenta**: se registra como obra bajo derecho de autor. Mientras no se venda: «depósito de obra inédita» ($1.400). Al venderse: registro de obra publicada ($3.800 + 0,2 % del precio) y entrega de una copia del código. | $1.400 hoy · $10.620 al vender | Inédita: ya · Publicada: con el primer cliente |
| **Hardware** (robot) | INPI | Patente o modelo de utilidad solo si el robot tuviera una invención nueva. Hoy usa piezas comunes (ruedas, ESP32-S3, relé): **no conviene patentar**. La forma de la carcasa podría registrarse más adelante como **diseño industrial**. | — | Cuando haya diseño propio |
| **Datos personales** (fotos de rostro) | **AAIP** | La base de datos es de cada fábrica: IDEPP le entrega la descripción para que la inscriba en el Registro Nacional de Bases de Datos, y la web pide el consentimiento de cada empleado (Ley 25.326). | Sin costo | En cada instalación |
| **Licencia de YOLO** (IA) | Ultralytics | YOLO tiene licencia **AGPL-3.0**: si lo ofrecemos como servicio, hay que publicar el código del servidor de IA o comprar la licencia empresarial. **Decisión pendiente de Morena** antes de vender (ver `../EMPRESA-SMAT/07-legal/propiedad-intelectual.md`). | A cotizar | Antes del primer cliente |

---

## 6. Sincronización con FAT (checklist)

| Indicador | Estado | Evidencia |
|---|---|---|
| La mejora técnica de FAT es realizable y viable en Emprendimiento | ✅ | Secciones 2 y 4; la plataforma funciona y está probada (`src/SMAT/README.md`) |
| Las horas de la mejora están en GitHub Projects | ✅ | Tablero «Kanban TOUCH-ID» del repositorio: una tarjeta por tarea del plan (`src/SMAT/docs/PLAN.md`) |
| La necesidad coincide con el relevamiento inicial | ⚠ Parcial | Tenemos el perfil del cliente (`../EMPRESA-SMAT/04-negocio/cliente-ideal.md`), pero **falta una encuesta propia** a responsables de seguridad e higiene. Propuesta de preguntas en el Anexo. |
| El análisis comercial está en la bitácora y en GitHub | ✅ | Esta carpeta (`docs/SMAT/documentacion-comercial/`) y `src/SMAT/docs/BITACORA.md` |

### Anexo · Encuesta propuesta (Google Forms) para responsables de seguridad e higiene

1. ¿En qué rubro está la planta y cuántas personas trabajan en producción?
2. ¿Cómo controlan hoy que se use el casco, los guantes, los lentes y el chaleco? (supervisor, cámaras, nada)
3. En el último año, ¿hubo accidentes o «casi accidentes» por no usar el equipo de protección?
4. ¿La ART o una inspección les hizo observaciones sobre el uso del EPP?
5. ¿Les serviría que una máquina se detenga sola si alguien no tiene su equipo? (sí / no / depende)
6. ¿Cuánto pagarían por un sistema que controle el EPP en todos los turnos? (rangos en pesos)
7. ¿Les interesaría probarlo gratis 30 días en una zona de la planta? (deje un contacto)

---

## Fuentes

- Render — [precios de la plataforma](https://render.com/pricing) (plan Starter, USD 7 por mes)
- Banco Nación — dólar oficial, venta, 06/11/2026 (C5N e iProfesional)
- Teclab — sueldo de un programador junior en Argentina, 2026
- NIC Argentina — aranceles de dominios `.ar` (Resolución 5/2024)
- INPI — arancel de marca en UMAPI, valores al 15/09/2026 (esderecho.com.ar; iProfesional, 22/03/2026 y 03/04/2026)
- argentina.gob.ar — DNDA: registro de software publicado e inédito
- Develop Argentina con datos de SysArmy/OpenQube — sueldos de desarrolladores junior, junio de 2026
- lifeindexed.com — sueldo promedio de un técnico en Argentina, 2026
- Mercado Libre Argentina y tiendas de electrónica (HobbyTronica, TodoMicro, PatagoniaTec, Unibot, Arsumo) — piezas del robot y del corte de máquina, noviembre de 2026
- iProfesional — comisiones de Mercado Pago
- Intenseye — [precios por cotización](https://www.intenseye.com/pricing/)
- Informe de costos y marco legal de TOUCH-ID (`docs/TOUCH-ID/costos_y_marco_legal.md` de este repositorio), del que se toman los valores de dominio, INPI y DNDA para que los dos equipos usen los mismos números
