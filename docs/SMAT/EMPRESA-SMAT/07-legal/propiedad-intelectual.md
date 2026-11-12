# Propiedad intelectual

> **Estado:** completo (v1) · **Responsable:** Tiziano · **Revisión:** Morena · **Actualizado:** 06/10/2026

**Para qué sirve:** cómo se protegen el nombre, el logo y el software, y qué licencias de terceros usamos.

> ⚠ Orientativo. Verificar requisitos, aranceles y plazos vigentes en el INPI y en la DNDA antes de iniciar cada trámite.

## 1. Marcas: «DROID-E3D» y «IDEPP»

- Se registran en el **INPI** (Instituto Nacional de la Propiedad Industrial), según la **Ley 22.362 de Marcas**. El registro dura 10 años y se renueva.
- Antes de presentar: **búsqueda de antecedentes** en la base del INPI para confirmar que no haya marcas iguales o parecidas en las mismas clases.
- **Clases recomendadas** (Clasificación de Niza):

| Clase | Qué cubre | Prioridad |
|---|---|---|
| **9** | Software, aparatos de detección y cámaras | 1 |
| **42** | Servicios de software en la nube y desarrollo tecnológico | 1 |
| 7 | Robots industriales | 2 (cuando se fabrique en serie) |

- Primero «**DROID-E3D**» en la clase 9 (presupuestado en la inversión inicial); luego la clase 42 y «IDEPP».
- El titular debe ser una persona con capacidad legal: mientras los socios sean menores, lo tramitan sus representantes o se espera a constituir la SAS.

## 2. Software

- El software está protegido como obra por la **Ley 11.723 de Propiedad Intelectual** (que incluye expresamente los programas de computación desde la Ley 25.036). La protección existe desde que se crea; el **depósito en la DNDA** (Dirección Nacional del Derecho de Autor) sirve como **prueba de fecha y autoría**.
- Se recomienda depositar la versión de la demo final (noviembre de 2026) con el código del backend, la web y el ESP32.
- Mientras tanto, el **historial de GitHub** (commits con fecha y autor) es una prueba útil de autoría.
- Según el acuerdo de socios, el software es de **IDEPP**.

## 3. Licencias de terceros que usamos

| Componente | Licencia | ¿Permite uso comercial? |
|---|---|---|
| Flask, Flask-SQLAlchemy | BSD-3-Clause | Sí, citando la licencia |
| SQLAlchemy, PyMySQL, PyJWT | MIT | Sí |
| React, React Router, Vite, Tailwind CSS | MIT | Sí |
| ArduinoJson | MIT | Sí |
| Núcleo Arduino para ESP32 | LGPL-2.1 | Sí, sin modificar la librería o publicando sus cambios |
| **YOLO de Ultralytics** | **AGPL-3.0** (o licencia empresarial paga) | ⚠ **Con condiciones**: si se ofrece como servicio, la AGPL obliga a publicar el código del sistema que la usa, salvo que se compre la licencia empresarial |

**Decisión pendiente (Morena):** antes de vender, elegir entre (a) comprar la licencia empresarial de Ultralytics, (b) publicar el código del servidor de IA bajo AGPL, o (c) usar un modelo de detección con licencia permisiva (Apache-2.0 o MIT). Para el proyecto final, el uso educativo no tiene este problema.

## 4. Secretos

Lo que **no** se publica ni se registra (se protege como secreto): el modelo de IA entrenado, los datos de entrenamiento, las claves del sistema y los precios de cada cliente.
