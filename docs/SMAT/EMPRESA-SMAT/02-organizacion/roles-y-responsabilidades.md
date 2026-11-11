# Roles y responsabilidades

> **Estado:** completo (v1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 06/10/2026

**Para qué sirve:** aclara qué hace cada socio y qué decide sin consultar.

## Toro · Software, web y relación con el profe

| Responsabilidades | Decide solo | Consulta con Morena |
|---|---|---|
| Backend, base de datos y web de DROID-E3D | Diseño interno del código, librerías aprobadas en el plan, orden de las tareas de la web | Cambios en `docs/API.md` que afecten al robot o a la IA |
| Despliegue (PythonAnywhere + Vercel/Netlify) | Configuración técnica del servidor | Gastos de hosting |
| Registrar las tareas del profe en GitHub y la bitácora semanal | Cómo se documenta | — |

## Morena · Hardware, IA y compras de componentes

| Responsabilidades | Decide solo | Consulta con Toro |
|---|---|---|
| Robot con ruedas, ESP32-S3 del robot, ESP32 de la máquina, relé | Componentes y armado, siempre dentro del presupuesto | Compras de más de USD 50 |
| Cámara, servidor YOLO y reconocimiento facial | Modelo de IA y su entrenamiento | Qué datos de empleados se usan (ver `../07-legal/datos-personales.md`) |
| Pruebas de integración con el backend | Cómo y cuándo prueba | Cambios en el contrato de la API |

## Tareas compartidas

| Tarea | Quién | Cómo |
|---|---|---|
| Relación con clientes y demos | Los dos | El que mejor conozca el tema que se muestra presenta esa parte. |
| Finanzas (gastos y aportes) | Los dos | Planilla compartida; cada gasto con su comprobante. |
| Redes y contenido | Los dos, alternando por semana | Ver `../03-marca/redes-y-dominio.md`. |
| Documentos de la empresa | El responsable de cada Issue | El otro socio revisa el Pull Request. |

## Suplencias

- Si Toro no está: Morena puede levantar la web local con el README y hacer la demo con los usuarios de prueba.
- Si Morena no está: Toro hace la demo con los simuladores (`simular_yolo.py`, `simular_esp32.py`) en lugar del robot real.
- Para que esto funcione, cada uno deja su parte documentada y subida a GitHub antes de cada entrega.
