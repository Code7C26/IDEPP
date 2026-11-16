# Manual de usuario de DROID-E3D

> **Estado:** completo (versión 1) · **Responsable:** Morena · **Revisión:** Tiziano · **Actualizado:** 16/11/2026

**Para qué sirve:** este manual lo recibe la fábrica junto con el robot. Explica cómo usar DROID-E3D todos los
días: prender el robot, seguir las alertas en la web, cuidarlo y resolver los problemas más comunes. La
instalación la hacemos nosotros (ver [`entrega-e-instalacion.md`](entrega-e-instalacion.md)).

**Versión para imprimir:** el librito A5 de 16 páginas, con el diseño de la caja, está en
[`manual-de-usuario/`](manual-de-usuario/) (`manual-de-usuario-A5.pdf` y la versión con 3 mm de sangrado para la imprenta).
Se arma desde `manual-de-usuario/manual.html`. Si cambia algo del producto, se cambia acá y en el librito.

## 1. Qué es DROID-E3D

DROID-E3D es un robot que **recorre la planta y controla que cada persona tenga puesto su equipo de
protección** (casco, chaleco, barbijo, lentes, según la zona). Funciona en tres partes:

| Parte | Qué hace |
|---|---|
| **El robot** | Recorre solo la ruta marcada en el piso. Con la cámara de sus «ojos» mira a las personas que se cruza. |
| **La IA, en una PC de la fábrica** | Mira el video de la cámara y detecta a quien trabaja sin su equipo. |
| **La web** (en la PC o en el celular) | Muestra las alertas con foto, el historial, los reportes y deja manejar el robot. |

Cuando la IA ve a alguien sin su equipo, **el robot se detiene, muestra un signo de peligro en su pantalla y
hace sonar una alarma durante 10 segundos**. Al mismo tiempo, la alerta llega con foto a la web.

## 2. Qué viene con el robot

- El robot DROID-E3D, con su cámara, su batería (2 pilas 18650) y su cargador.
- La cinta para la ruta y las marcas de cada zona (ya pegadas el día de la instalación).
- La IA instalada en la PC de la fábrica (o en la mini PC, si la compraron aparte).
- Los usuarios de la web para el encargado y para cada empleado.
- Este manual.

### Las partes del robot

| Parte | Dónde está | Para qué sirve |
|---|---|---|
| Cámara | En los «ojos» | Manda el video a la IA |
| Pantalla | En el pecho | Muestra el signo de peligro cuando hay una alerta |
| Parlante | En el pecho, abajo | La alarma |
| Orugas | Abajo | Lo mueven por la planta |
| Seguidores de línea | Debajo, entre las orugas | Siguen la cinta del piso |
| Sensor de distancia | Adelante, abajo | Lo frenan si hay algo a menos de 20 cm |
| Brazos y cabeza | Arriba | Se mueven con motores pequeños (servos) |

### Palabras que usamos en este manual

| Palabra | Qué quiere decir |
|---|---|
| **IA (inteligencia artificial)** | El programa de la PC que mira el video y reconoce si falta el equipo |
| **Equipo de protección** | Casco, chaleco, barbijo, lentes o guantes. A veces se lo llama EPP |
| **WiFi de 2,4 GHz** | El tipo de WiFi más común. El robot no se conecta al de 5 GHz |
| **Ruta** | La cinta pegada en el piso que el robot sigue para recorrer la planta |

## 3. El uso de todos los días

### Al empezar el turno

1. **Prender la PC** donde está instalada la IA. La IA arranca sola y busca al robot y a la cámara en el WiFi.
2. **Prender el robot** con su interruptor y dejarlo sobre la cinta del piso, al inicio de la ruta.
3. **Entrar a la web** con tu usuario y contraseña.
4. Ir a **Robot** y tocar **Iniciar**. El robot empieza a recorrer la ruta.

### Durante el turno

- El robot recorre la ruta solo. **No hace falta tocarlo.**
- Si la IA detecta a alguien sin su equipo, el robot se detiene 10 segundos, muestra el signo de peligro y
  suena la alarma. Después **sigue solo con su recorrido**.
- Si hay algo delante del robot (una caja, una persona), frena y espera a que se despeje el paso.
- Las alertas aparecen en la web en el momento, con foto, zona y equipo que faltaba.

### Al terminar el turno

1. En la web, en **Robot**, tocar **Detener**.
2. Apagar el robot y **ponerlo a cargar** con su cargador, en el enchufe de su base.
3. La PC se puede apagar, o dejar prendida si hay otro turno.

### Parada de emergencia

Si el robot tiene que frenar ya, en la web, en **Robot**, tocar **PARADA DE EMERGENCIA**. El robot se
detiene y queda bloqueado. Para volver a usarlo, primero tocar **Detener** (así sale de la emergencia) y
después **Iniciar**.

## 4. La web para el encargado

Se entra desde la PC o el celular con el usuario del encargado. Tiene estas secciones:

| Sección | Qué se hace ahí |
|---|---|
| **Panel** | Lo más importante de un vistazo: alertas activas, empleados en planta, el mapa de la fábrica (tocando una zona se ve su detalle) y las últimas alertas. Se actualiza solo cada pocos segundos. |
| **Incidencias** | Todas las alertas, con filtros. Tocando **Ver detalle** se ve la foto, quién era, la zona y qué equipo le faltaba. Cuando ya se habló con la persona, se marca como **resuelta**. |
| **Robot** | El video en vivo de la cámara, dónde está el robot en el mapa y los botones **Iniciar**, **Pausar**, **Detener** y **PARADA DE EMERGENCIA**. También se edita la ruta. |
| **Zonas** | Las zonas de la planta, el equipo de protección obligatorio en cada una y su lugar en el mapa. |
| **Empleados** | Dar de alta, editar o dar de baja a cada empleado y cargar sus fotos de rostro (con su consentimiento firmado). Si se da de baja a alguien, ya no entra a la web, sus fotos se borran y su historial se conserva. |
| **Reportes** | Gráficos de alertas por día, por zona y por tipo de equipo, el cumplimiento promedio y el ranking de cumplimiento por empleado y por zona. |
| **Auditoría** | El registro de todo lo que se hizo en la web y quién lo hizo. |

## 5. La web para los empleados

Cada empleado entra con su propio usuario, desde su celular:

| Sección | Qué ve |
|---|---|
| **Inicio** | Su cumplimiento del día, dónde está el robot y sus últimas alertas. |
| **Mis alertas** | Todas sus alertas, con la foto y el detalle de cada una. |
| **Mi perfil** | Sus datos, sus fotos de rostro y el tema de la pantalla (claro u oscuro). |

Cada empleado ve **solo sus propias alertas**, nunca las de sus compañeros.

## 6. Manejar el robot con el celular (control remoto)

Además de recorrer la ruta solo, el robot se puede manejar a mano desde el celular, por ejemplo para llevarlo
a otro lugar o para mostrarlo.

1. Conectar el celular al **mismo WiFi** que el robot.
2. Abrir en el navegador **http://droid-robot.local**.
3. Tocar **Control remoto** y arrastrar el círculo naranja (el joystick). Al soltarlo, el robot frena.
4. Para que vuelva a recorrer la ruta, ponerlo sobre la cinta y tocar **Recorrer la ruta**.

Aunque se maneje a mano, **la cámara y las alertas siguen funcionando**.

## 7. Cambiar el WiFi del robot o de la cámara

Si la fábrica cambia el WiFi o la clave, o el robot se lleva a otra planta, el robot y la cámara no van a
encontrar la red. Entonces, al prenderse:

- El robot crea su propia red, **«DROID-E3D-Robot»**, y su pantalla se pone **azul**.
- La cámara crea la red **«DROID-E3D-Camara»** y prende una **luz roja**.

Para configurarlos:

1. Desde el celular, conectarse a esa red. La clave es **droid-e3d**.
2. Se abre sola una página (si no se abre, entrar a **http://192.168.4.1**).
3. Elegir el WiFi de la fábrica, escribir su clave y tocar **Guardar**.
4. El robot (o la cámara) se reinicia y se conecta solo. Hacer lo mismo con el otro.

El WiFi tiene que ser de **2,4 GHz** (el de 5 GHz no sirve).

## 8. Cuidados

- **No mojarlo** ni usarlo sobre charcos o pisos con aceite.
- **Limpiar la cámara** de los ojos una vez por semana con un paño seco. Si está sucia, la IA ve peor.
- **Cuidar la cinta del piso:** si se despega o se rompe, el robot pierde la ruta. Avisarnos para cambiarla.
- **No levantarlo de los brazos ni de la cabeza:** se levanta del cuerpo.
- **Cargarlo solo con su cargador** y no dejarlo cerca del calor.
- No tapar el sensor de distancia de adelante.

## 9. Si algo no anda

| Qué pasa | Qué hacer |
|---|---|
| El robot no arranca al tocar **Iniciar** | Revisar que esté prendido, cargado y sobre la cinta. Si la pantalla está azul, se olvidó el WiFi: ver la sección 7. |
| La pantalla del robot está azul | No encuentra el WiFi. Configurarlo desde el celular (sección 7). |
| La cámara tiene una luz roja prendida | No encuentra el WiFi. Configurarla desde el celular (sección 7). |
| En la web no se ve el video | Revisar que la cámara esté prendida y que la PC de la IA esté prendida y en el mismo WiFi. |
| No llegan alertas | Revisar que la PC de la IA esté prendida. Si se reinició, esperar un minuto a que encuentre al robot y a la cámara. |
| El robot se sale de la ruta | Revisar que la cinta esté bien pegada y que no haya suciedad encima. Si sigue, llamarnos para calibrarlo. |
| El robot frena y no avanza | Puede haber algo delante. Despejar el paso. |
| Suena la alarma, pero no hay nadie sin su equipo | Puede ser un error de la IA (por ejemplo, poca luz). Marcar la alerta como resuelta y avisarnos para mejorarla. |

## 10. Soporte

- **Soporte remoto** de lunes a viernes de 9 a 17 h, incluido en el abono mensual.
- **Una visita cada 3 meses** para revisar el robot, la cámara y la ruta.
- **Contacto:** idepp.3d@gmail.com
- **Versión del manual:** 1 · noviembre de 2026

---

*DROID-E3D by IDEPP · 2026*
