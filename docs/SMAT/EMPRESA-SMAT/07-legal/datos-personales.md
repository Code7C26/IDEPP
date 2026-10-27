# Datos personales y consentimiento

> **Estado:** completo (v1.1) · **Responsable:** Toro · **Revisión:** Morena · **Actualizado:** 22/10/2026

**Para qué sirve:** DROID-E3D guarda fotos de rostros y de evidencia: hay que tratarlas según la ley.

> ⚠ Orientativo. Antes de usar datos reales, verificar con un profesional y con las guías vigentes de la AAIP.

## 1. Marco legal

- **Ley 25.326 de Protección de los Datos Personales** y su decreto reglamentario.
- **AAIP** (Agencia de Acceso a la Información Pública): es la autoridad de control. Publicó criterios sobre datos biométricos (Resolución 4/2019); según su uso, pueden considerarse **datos sensibles**. Por eso DROID-E3D aplica siempre el **criterio más protector**.

## 2. Roles

| Rol | Quién | Qué significa |
|---|---|---|
| **Responsable** de la base de datos | La fábrica cliente | Decide para qué se usan los datos; registra la base y responde ante los empleados |
| **Encargado del tratamiento** | SMAT | Procesa los datos solo para prestar el servicio, según el contrato (cláusula 8) |

## 3. Qué datos guardamos

| Dato | Para qué | Cuánto tiempo |
|---|---|---|
| Nombre, usuario, legajo, zona | Identificar al empleado en la plataforma | Mientras trabaje en la empresa |
| **Fotos de rostro** | Que la IA reconozca a cada empleado | Hasta que el empleado retire el consentimiento o deje la empresa |
| **Fotos de evidencia** de cada alerta | Demostrar la falta y permitir revisarla | **90 días** |
| Alertas (fecha, zona, tipo, confianza) | Historial y reportes de cumplimiento | 2 años |
| Auditoría (quién hizo qué) | Control interno | 2 años |

## 4. Principios que aplicamos

1. **Finalidad:** los datos se usan **solo para seguridad** (control del EPP). Nunca para controlar productividad, horarios ni conductas ajenas a la seguridad.
2. **Mínimo necesario:** no se graba video continuo; solo se guarda la foto del momento de la alerta.
3. **Consentimiento:** libre, expreso, informado y por escrito, antes de cargar fotos de rostro (art. 5 de la Ley 25.326). La web pide confirmarlo antes de subir fotos (Fase 6).
4. **Seguridad:** acceso con usuario y contraseña, roles, claves de máquinas, contraseñas cifradas; las fotos no son públicas (art. 9).
5. **Derechos del empleado:** puede **ver** sus alertas y sus fotos (en la web: «Mis alertas» y «Mi perfil»), pedir que se **corrijan** o se **borren** (arts. 14 y 16).

## 5. Texto de consentimiento (modelo)

> Yo, [nombre y apellido], DNI [ ], empleado de [empresa], fui informado de que la empresa usa el sistema DROID-E3D para controlar el uso de los elementos de protección personal. Autorizo a que se tomen y guarden fotos de mi rostro **solo para que el sistema me identifique** cuando detecte que no uso el equipo de protección, y a que se guarde una foto de cada alerta durante 90 días. Sé que puedo ver mis alertas, pedir que se corrijan o borren mis datos y **retirar este consentimiento** en cualquier momento, avisando a [responsable]. Responsable de la base: [empresa]. Firma: [ ] Fecha: [ ]

## 6. Registro de la base

La fábrica debe evaluar si corresponde **inscribir la base de datos** en el registro de la AAIP. SMAT le entrega la descripción de los datos (esta tabla) para hacerlo.

## 7. En el proyecto final

Para la demo **no se usan datos reales**: los empleados de la base son ficticios y las fotos de prueba son de los integrantes del equipo, con su consentimiento.

### Fotos del servidor de IA en GitHub (actualizado 21/10/2026)

- Hasta el 19/10/2026, las fotos con las que la IA reconoce caras (`src/SMAT/servidor_ia/fotos_trabajadores/`) estaban subidas al repo. Eran de 8 personas, entre ellas compañeros de TOUCH.
- Desde el 19/10 **ya no se suben**: la carpeta está en `.gitignore` y las fotos se pasan por fuera de GitHub (PR #73).
- **Siguen en el historial de git**, aunque no se vean en la versión actual. El repo es **privado**. **No se reescribe el historial**, porque cambiaría el repo de todo TOUCH (unos 30 colaboradores).
- Si alguien pide que se borren sus fotos: se borra su carpeta en cada PC que tenga la copia y sus fotos en la web (Mi perfil o Empleados). Si además exige sacarlas del historial, se decide con TOUCH y el profe.
- ✅ **Consentimientos confirmados** (22/10/2026): las 8 personas de las fotos dieron su consentimiento (modelo en la sección 5). Si alguien lo retira, se borra su carpeta y sus fotos en la web, como se indica arriba.
