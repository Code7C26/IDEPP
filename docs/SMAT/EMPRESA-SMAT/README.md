# EMPRESA-SMAT · documentos de la empresa

<p align="center"><img src="03-marca/logo/droid-e3d.svg" alt="DROID-E3D by IDEPP" width="320"></p>

**IDEPP** es una empresa de 5 socios con dos productos: **TOUCH-ID** y **DROID-E3D**. Esta carpeta documenta **DROID-E3D**, un robot que recorre la fábrica y controla con inteligencia artificial el uso del equipo de protección personal, más la web donde se gestionan las alertas.
Socios: **Tiziano** (software y web) y **Morena** (hardware e IA).

**Pitch en 30 segundos:** [09-presentaciones/pitch.md](09-presentaciones/pitch.md)

## Índice y estado

**Versión 1 completa (06/10/2026).** Todos los documentos están escritos; las cifras son estimaciones con sus supuestos a la vista. Morena los revisa en el Pull Request; el acuerdo de socios queda listo para que firmen los dos.

| Área | Documento | Responsable | Estado |
|---|---|---|---|
| Identidad | [Misión, visión y valores](01-identidad/mision-vision-valores.md) | Tiziano | completo (v1) |
| | [Historia de IDEPP](01-identidad/historia.md) | Tiziano | completo (v1) |
| | [IDEPP y sus dos productos](01-identidad/idepp-y-sus-productos.md) | Tiziano | completo (v1) |
| Organización | [Organigrama](02-organizacion/organigrama.md) | Tiziano | completo (v1) |
| | [Roles y responsabilidades](02-organizacion/roles-y-responsabilidades.md) | Tiziano | completo (v1) |
| | [Acuerdo de socios](02-organizacion/acuerdo-de-socios.md) | Tiziano | completo (v1) · **falta la conformidad de los dos socios** |
| | [Toma de decisiones](02-organizacion/toma-de-decisiones.md) | Tiziano | completo (v1) |
| | [Actas de reunión](02-organizacion/actas/README.md) | Quien escribe cada acta | completo (v1) · 1 acta |
| Marca | [Manual de marca](03-marca/manual-de-marca.md) | Tiziano | completo (v1) |
| | [Redes sociales y dominio](03-marca/redes-y-dominio.md) | Tiziano | completo (v1) |
| | [Logos (SVG)](03-marca/logo/README.md) | Morena | completo (v2) |
| Negocio | [Business Model Canvas](04-negocio/business-model-canvas.md) | Tiziano | completo (v1) |
| | [Cliente ideal](04-negocio/cliente-ideal.md) | Tiziano | completo (v1) |
| | [Competencia](04-negocio/competencia.md) | Tiziano | completo (v1) |
| | [Propuesta de valor](04-negocio/propuesta-de-valor.md) | Tiziano | completo (v1) |
| Finanzas | [Inversión inicial](05-finanzas/inversion-inicial.md) | Tiziano | completo (v1) |
| | [Costo de un DROID-E3D](05-finanzas/costos-droid-e3d.md) | Tiziano | completo (v1) |
| | [Precios](05-finanzas/precios.md) | Tiziano | completo (v1) |
| | [Proyección a 3 años](05-finanzas/proyeccion-3-anios.md) | Tiziano | completo (v1) |
| | [Financiamiento](05-finanzas/financiamiento.md) | Tiziano | completo (v1) |
| Comercial | [Plan de marketing](06-comercial/plan-de-marketing.md) | Tiziano | completo (v1) |
| | [Propuesta comercial (modelo)](06-comercial/propuesta-comercial-modelo.md) | Tiziano | completo (v1) |
| | [Contrato de servicio (modelo)](06-comercial/contrato-de-servicio-modelo.md) | Tiziano | completo (v1) · revisar con abogado antes de usarlo |
| Legal | [Forma jurídica](07-legal/forma-juridica.md) | Tiziano | completo (v1) · orientativo |
| | [Propiedad intelectual](07-legal/propiedad-intelectual.md) | Tiziano | completo (v1) · orientativo |
| | [Normativa de seguridad e higiene](07-legal/normativa-seguridad-higiene.md) | Tiziano | completo (v1) · orientativo |
| | [Datos personales y consentimiento](07-legal/datos-personales.md) | Tiziano | completo (v1) · orientativo |
| Análisis | [FODA del equipo (PDF)](08-analisis/foda.pdf) | Los dos | completo (v2) · con reflexión final |
| Presentaciones | [Pitch de 1 página](09-presentaciones/pitch.md) | Tiziano | completo (v1) |
| | [Guion para el jurado](09-presentaciones/guion-jurado.md) | Tiziano | completo (v1) |
| | [Mini pitch: documentación inicial (PDF)](09-presentaciones/mini-pitch.pdf) | Los dos | completo (v1) · cartel |

Estados: `plantilla` → `borrador` → `completo (v1)` → `aprobado` (cuando los dos socios lo aprueban en un Pull Request).

## Números clave (de los documentos de finanzas)

| | |
|---|---|
| Costo por instalación | USD 1.343 |
| Precio (Plan Compra) | USD 2.200 + USD 70 por mes |
| Inversión inicial | USD 740 (50 % cada socio) |
| Clientes proyectados | 3 (2027) · 10 (2028) · 25 (2029) |
| Resultado proyectado | USD 1.579 · 7.217 · 15.865 |

## Cómo trabajamos

1. Cada área tiene un Issue `smat:empresa` (#29 a #37).
2. Los cambios se hacen en la rama `SMAT-empresa` y entran a `main` por Pull Request, que revisa el otro socio.
3. Las decisiones de los dos van en un Issue `smat:decision` (ver [Toma de decisiones](02-organizacion/toma-de-decisiones.md)).
4. Las reuniones quedan en [actas](02-organizacion/actas/README.md).

## Pendientes que dependen de los socios

- **Conformidad del acuerdo de socios** (Tiziano y Morena).
- **Licencia de la IA** para uso comercial: elegir entre licencia empresarial de YOLO, publicar el código o cambiar de modelo (Morena) — ver [Propiedad intelectual](07-legal/propiedad-intelectual.md).
- **Cotizar en pesos** los componentes antes de comprar (Morena) — ver [Costos](05-finanzas/costos-droid-e3d.md).
- **Verificar** disponibilidad del dominio y aranceles del INPI antes de pagar.
