<p align="center">
  <img src="../../assets/SMAT/droid-e3d.png" alt="Logo DROID-E3D by SMAT" width="380">
</p>

<h3 align="center">Seguridad que recorre la planta</h3>

<p align="center">
  Robot con inteligencia artificial que controla que los trabajadores de una fábrica usen su equipo de protección
  y detiene la máquina de la zona si no lo hacen.<br>
  <b>DROID-E3D by SMAT</b> · una división de TOUCH
</p>

---

## 📌 Información general

| Dato | Descripción |
|---|---|
| **Producto** | DROID-E3D |
| **Agencia** | SMAT, división de TOUCH (empresa madre, creadora de Touch ID) |
| **Equipo** | **Toro** (software y web) · **Morena** (hardware e IA) |
| **Tipo de proyecto** | Hardware y software: robot con cámara + servidor de IA + plataforma web |
| **Estado** | MVP al **75 %** (08/10/2026): la plataforma y la IA ya funcionan juntas; falta la prueba con el robot y el relé reales |
| **Materias** | FAT y Emprendimiento · profesora Tamara Piccinni |

---

## ❓ ¿Qué problema resuelve?

En una PyME industrial nadie puede mirar todo el tiempo si cada trabajador tiene puesto el casco, los guantes, los
lentes y el chaleco:

- Un supervisor cubre un solo turno y no ve toda la planta.
- Un accidente cuesta días de trabajo, sube la alícuota de la ART y puede terminar en un juicio.
- En una inspección la fábrica tiene que demostrar que controla el uso del equipo.
- El control a mano genera roces («siempre lo usé así», «me molestan los lentes»).

## 💡 ¿Cómo lo resuelve?

Un **robot de oruga** recorre las zonas de la planta con una cámara. Un **servidor de IA** (YOLO) detecta a quien
trabaja sin su equipo y reconoce de quién es la cara (solo con su consentimiento). La **plataforma web** muestra la
alerta con foto al instante y un ESP32 con relé **detiene solo la máquina de esa zona** hasta que el encargado la
reactive.

| Función | Descripción |
|---|---|
| 🦺 **Detección de EPP** | Casco, guantes, lentes y chaleco, según lo que exige cada zona |
| 🚨 **Alerta con foto** | Llega en segundos al panel del encargado, con la zona, el empleado y la confianza de la IA |
| ⛔ **Parada por zona** | Se corta solo la máquina donde está el riesgo; el resto de la planta sigue |
| 🤖 **Control del robot** | Iniciar, pausar, parada de emergencia, ruta por zonas y video en vivo desde la web |
| 🗺️ **Mapa de la fábrica** | Estado de cada zona y del robot en tiempo real |
| 📋 **Registro y auditoría** | Historial para la ART y las inspecciones; quién resolvió cada alerta |
| 👷 **Vista del empleado** | Cada uno ve su cumplimiento, sus alertas y sus fotos (y las puede borrar) |

## 🎯 Público objetivo

| Público | ¿Por qué lo necesita? |
|---|---|
| 🏭 **Dueño de la PyME** | Menos accidentes y menos riesgo legal: «un accidente evitado paga el sistema» |
| 🦺 **Responsable de higiene y seguridad** | Control en todos los turnos y registro listo para la inspección |
| 👷 **Encargado de planta** | Ve todo desde el celular; solo frena la máquina donde hace falta |
| 👤 **Empleado** | Recibe el aviso primero y ve su propio cumplimiento |

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| ESP32 (robot y máquinas) | Movimiento del robot y relé que corta la máquina |
| Cámara (celular con IP Webcam) | Video de cada zona |
| Python · YOLO · OpenCV | Detección de EPP y reconocimiento facial (`src/SMAT/servidor_ia/`) |
| Python · Flask · MySQL | Backend y base de datos (`src/SMAT/backend/`) |
| React · Vite · Tailwind | Plataforma web y página pública (`src/SMAT/frontend/`) |
| Pytest · Playwright · GitHub Actions | 76 pruebas de la API y 21 en el navegador en cada cambio |

## 📁 Estructura de SMAT en el repositorio

```text
TOUCH-ID/
├── assets/SMAT/        Logos (PNG y SVG)
├── design/SMAT/        Diseño digital y capturas de la app
├── docs/SMAT/          ← estás acá
│   ├── documentacion-comercial/   Entregas de Emprendimiento (Canvas, costos, punto de equilibrio, mercado, primeros 10)
│   ├── EMPRESA-SMAT/              La empresa completa: identidad, marca, negocio, finanzas, legal, pitch
│   └── Reporte-Avance-*.pdf       Balances del MVP
└── src/SMAT/           Código: backend, frontend, servidor de IA, pruebas y documentación técnica
```

---

## 🗂️ Entregas de Classroom

### Emprendimiento

| Consigna | Dónde |
|---|---|
| Modelo de negocio y viabilidad comercial | [documentacion-comercial/01-viabilidad-comercial.md](documentacion-comercial/01-viabilidad-comercial.md) |
| Business Model Canvas | [documentacion-comercial/02-business-model-canvas.md](documentacion-comercial/02-business-model-canvas.md) |
| Punto de equilibrio | [documentacion-comercial/03-punto-de-equilibrio.md](documentacion-comercial/03-punto-de-equilibrio.md) |
| Dimensión del mercado (TAM, SAM, SOM) | [documentacion-comercial/04-dimension-del-mercado.md](documentacion-comercial/04-dimension-del-mercado.md) |
| Los primeros 10 | [documentacion-comercial/05-los-primeros-10.md](documentacion-comercial/05-los-primeros-10.md) |

Todas con PDF y enlace para Classroom en [documentacion-comercial/README.md](documentacion-comercial/README.md).

### FAT

| Consigna | Dónde |
|---|---|
| Daily 5: Issues y tablero Kanban | [Issues con etiqueta `smat:web`](https://github.com/Code7C26/TOUCH-ID/issues?q=label%3Asmat%3Aweb) y el tablero «Kanban TOUCH-ID» en GitHub Projects |
| Balance real del MVP | [Reporte del 08/10/2026 (75 %)](Reporte-Avance-DROID-E3D-2026-10-08.pdf) · [anterior, 05/10 (38 %)](Reporte-Avance-DROID-E3D-2026-10-05.pdf) |
| Trabajo remoto autónomo (refactor, feat, docs) | Commits con esos prefijos en la rama `SMAT-web` y el [README técnico](../../src/SMAT/README.md) |
| Bitácora técnica | [src/SMAT/docs/BITACORA.md](../../src/SMAT/docs/BITACORA.md) |
