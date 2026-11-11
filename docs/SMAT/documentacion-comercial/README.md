# Documentación comercial · DROID-E3D by SMAT

Entregas de **Emprendimiento** (en conjunto con FAT), profesora Tamara Piccinni. Cada una está en Markdown (se lee
acá en GitHub) y en PDF con carátula, listo para subir a Classroom.

| # | Consigna de Classroom | Entrega | PDF | Enlace para Classroom |
|---|---|---|---|---|
| 1 | Modelo de negocio y viabilidad comercial (Fase 1, Fase 2 y checklist con FAT) | [01-viabilidad-comercial.md](01-viabilidad-comercial.md) | [PDF](pdf/01-viabilidad-comercial.pdf) | `https://github.com/Code7C26/TOUCH-ID/blob/main/docs/SMAT/documentacion-comercial/pdf/01-viabilidad-comercial.pdf` |
| 2 | Business Model Canvas | [02-business-model-canvas.md](02-business-model-canvas.md) | [PNG](canvas/business-model-canvas.png) · [PDF](canvas/business-model-canvas.pdf) | `https://github.com/Code7C26/TOUCH-ID/blob/main/docs/SMAT/documentacion-comercial/canvas/business-model-canvas.png` |
| 3 | Finanzas de la agencia: punto de equilibrio (17/09, entrega 01/10) | [03-punto-de-equilibrio.md](03-punto-de-equilibrio.md) | [PDF](pdf/03-punto-de-equilibrio.pdf) | `https://github.com/Code7C26/TOUCH-ID/blob/main/docs/SMAT/documentacion-comercial/pdf/03-punto-de-equilibrio.pdf` |
| 4 | Dimensión del mercado: TAM, SAM y SOM (01/10) | [04-dimension-del-mercado.md](04-dimension-del-mercado.md) | [PDF](pdf/04-dimension-del-mercado.pdf) | `https://github.com/Code7C26/TOUCH-ID/blob/main/docs/SMAT/documentacion-comercial/pdf/04-dimension-del-mercado.pdf` |
| 5 | Estrategias de adquisición: «Operación: Los primeros 10» | [05-los-primeros-10.md](05-los-primeros-10.md) | [PDF](pdf/05-los-primeros-10.pdf) | `https://github.com/Code7C26/TOUCH-ID/blob/main/docs/SMAT/documentacion-comercial/05-los-primeros-10.md` |

**Todas usan los mismos números:** costos en `01` (con fuentes), precio y punto de equilibrio en `03`, mercado en
`04`. El detalle completo de la empresa está en [`../EMPRESA-SMAT/`](../EMPRESA-SMAT/).

## Anteriores

[`anteriores/`](anteriores/) guarda el primer documento de viabilidad que se subió, que corresponde al proyecto
anterior (**KIDO**, robot para niños). Quedó reemplazado por `01-viabilidad-comercial.md`, hecho para DROID-E3D.

## Cómo regenerar los PDF

Si se cambia un `.md` o el Canvas, desde la raíz del repo (con `gh` logueado):

```powershell
src\SMAT\backend\venv\Scripts\python.exe docs\SMAT\herramientas\generar_pdf.py
```
