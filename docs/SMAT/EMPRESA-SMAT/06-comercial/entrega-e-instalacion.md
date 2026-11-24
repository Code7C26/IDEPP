# Entrega e instalación de DROID-E3D

> **Estado:** borrador (v1) · **Responsable:** Morena · **Revisión:** Tiziano · **Actualizado:** 15/11/2026

**Para qué sirve:** qué recibe la fábrica cuando compra DROID-E3D y qué hacemos el día que lo instalamos.
Lo usamos para preparar cada instalación, para el manual de usuario y para responder «¿cómo lo instalan?».

DROID-E3D se instala **en un día**, en la planta, sin obra y sin cables nuevos: solo necesita el WiFi de la
fábrica y una PC.

## 1. Qué recibe la fábrica

| Qué | Para qué |
|---|---|
| **El robot DROID-E3D**, con su cámara, batería y cargador | Recorre la planta, mira y da la alarma en la zona |
| **La cinta para la ruta** y las marcas de cada zona | El robot sigue la línea del piso y cuenta en qué zona está |
| **La IA instalada en una PC de la fábrica** (o la mini PC, si la compran aparte: $350.000) | Analiza el video y detecta a quien trabaja sin su equipo |
| **Acceso a la plataforma web y la app** para el encargado y los empleados | Alertas con foto, historial, reportes y control del robot |
| **Capacitación**: 2 horas para el encargado y 15 minutos para los empleados | Que sepan usarlo desde el primer día |
| **Manual de usuario** | Para resolver las dudas de todos los días |

Precio: **$1.400.000** de pago único y **$75.000 por mes** (plataforma, soporte, actualizaciones y una visita
cada 3 meses). Detalle en [`../05-finanzas/precios.md`](../05-finanzas/precios.md).

## 2. Qué tiene que tener la fábrica

- [ ] **WiFi de 2,4 GHz** en las zonas que recorre el robot (el de 5 GHz no sirve).
- [ ] **Una PC** con procesador i5 o similar y 8 GB de RAM, prendida en el horario de trabajo y conectada al
      mismo WiFi. Si no tiene, se ofrece la mini PC.
- [ ] **Piso donde pegar la cinta** (o líneas ya pintadas, ver el paso 2 de la sección 4) y pasillos por donde
      pueda pasar el robot.
- [ ] **Un enchufe** cerca de la base del robot, para cargarlo.
- [ ] **El consentimiento firmado** de los empleados para el uso de su imagen (ver
      [`../07-legal/datos-personales.md`](../07-legal/datos-personales.md)).

## 3. Antes de ir a la planta (en IDEPP)

| Tarea | Quién | Horas |
|---|---|---|
| Armar y probar el robot, con su programa cargado y la batería cargada | Morena | 12 |
| Crear la cuenta de la fábrica en la web | Tiziano | — |
| Pedirle a la fábrica la lista de zonas, el equipo de protección de cada una y los empleados | Los dos | — |

## 4. El día de la instalación

Son unas **8 horas** de instalación más **2 de capacitación** (las que figuran en los costos).

1. **Recorrer la planta con el encargado.** Definimos las zonas, qué equipo de protección se exige en cada una
   y por dónde va a pasar el robot.
2. **Pegar la ruta.** La cinta negra marca el recorrido, y una cinta que la cruza marca la entrada de cada zona.
   Si la planta **ya tiene líneas pintadas** en el piso (por ejemplo, las de los pasillos) y se distinguen bien
   del piso, el robot puede seguir esas: solo calibramos sus sensores en el lugar (http://droid-robot.local/sensores).
3. **Conectar el robot y la cámara al WiFi desde el celular.** Al prenderlos por primera vez, el robot crea la
   red «DROID-E3D-Robot» (con la pantalla azul) y la cámara la red «DROID-E3D-Camara» (con una luz roja). Nos
   conectamos con el celular, elegimos el WiFi de la fábrica y escribimos su clave. No hace falta reprogramar
   nada.
4. **Instalar la IA en la PC** y comprobar que encuentra sola al robot y a la cámara (los busca por su nombre,
   `droid-robot` y `droid-camara`, así que no hay que escribir direcciones).
5. **Cargar todo en la web**: las zonas, la ruta, los empleados y, con su consentimiento, las fotos de rostro.
6. **Prueba completa.** Alguien pasa sin casco frente al robot: el robot se detiene, muestra el signo de
   peligro, suena la alarma y la alerta llega con foto al celular del encargado.
7. **Capacitación**: al encargado (panel, alertas, reportes y cómo iniciar o frenar el robot) y a los empleados
   (qué hace el robot y cómo ven sus alertas en el celular).

**El robot tiene dos formas de moverse:** en la fábrica **recorre solo la ruta**; para mostrarlo o moverlo de
lugar se puede manejar **a control remoto** desde el celular (http://droid-robot.local).

## 5. Después de la instalación

- **Soporte remoto** de lunes a viernes de 9 a 17 h (incluido en el abono).
- **Una visita cada 3 meses** para revisar el robot, la cámara y la ruta.
- Si cambian el WiFi de la fábrica o llevan el robot a otra planta, el robot vuelve a crear su red y se
  configura de nuevo desde el celular.

## 6. Qué nos falta para poder entregarlo así (al 15/11/2026)

| Falta | Quién |
|---|---|
| Publicar la web en internet | Tiziano |
| Un instalador de la IA (que se abra con doble clic y arranque sola al prender la PC) | Morena |
| La batería, los motores de las orugas y montar todo en el cuerpo del robot | Morena (con el profesor) |
| Un sensor de distancia que mida bien (el actual no mide) | Morena |
| Reentrenar el modelo para que detecte bien el chaleco y los lentes | Morena |
| ~~El manual de usuario~~ (hecho: [`manual-de-usuario.md`](manual-de-usuario.md)) | Los dos |
