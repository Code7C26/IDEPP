# Match Tecnológico · DROID-E3D

> **Materia:** Emprendimiento (en conjunto con FAT) · **Profesora:** Tamara Piccinni · **Agencia:** IDEPP
> **Equipo:** Tiziano · Morena · **Actualizado:** 12/11/2026

## Explicación breve del proyecto

Nuestro proyecto es DROID-E3D, un robot que recorre las zonas de una fábrica con una cámara y se fija si los
trabajadores tienen puesto su equipo de protección: casco, guantes, lentes y chaleco.

Si ve a alguien trabajando sin su equipo, la computadora lo detecta con inteligencia artificial, reconoce quién es
(siempre que esa persona haya dado su permiso) y manda una alerta con foto a la página del empleado y a la del
encargado. Al mismo tiempo, el robot hace sonar su alarma para que el trabajador se dé cuenta en el momento.

En la página, el encargado puede ver el mapa de la fábrica, las alertas y el robot, y sacar reportes para la ART.
Cada empleado puede ver sus propias alertas. DROID-E3D es uno de los dos productos de nuestra empresa, IDEPP; el otro
es TOUCH-ID, que controla la asistencia con huella.

## 1. Viabilidad

Creemos que el proyecto es muy viable. Las piezas del robot se consiguen fácil: pensamos usar una placa ESP32,
motores chicos, un buzzer para la alarma y un celular como cámara. Para la inteligencia artificial vamos a usar YOLO,
que es gratis y ya sirve para detectar objetos en un video.

También nos parece viable como negocio. Queremos que sea algo que una PyME pueda pagar, más barato que poner cámaras
en cada zona o tener a una persona controlando todo el día. La idea es venderlo con un pago único y después cobrar un
abono por mes por la página y el mantenimiento.

Entre los dos cubrimos todo: Morena se encarga del robot y la inteligencia artificial, y Tiziano de la página web y
la base de datos. Como vamos a usar fotos de las caras, le vamos a pedir permiso a cada trabajador, como dice la
Ley 25.326.

## 2. ¿Existe?

Sí, existen cosas parecidas, pero ninguna hace exactamente lo mismo. Hay empresas como Intenseye o Protex AI que
ponen cámaras fijas con inteligencia artificial, pero hace falta una cámara en cada zona, con obra y cableado, y
venden sobre todo a empresas grandes y en dólares. Nosotros usamos un solo robot que va recorriendo varias zonas.

Otra opción es tener un supervisor que recorra la planta, pero es un sueldo por turno, no llega a ver todo y no queda
registro de las faltas. Algunas fábricas controlan el equipo solo en la entrada, pero después el trabajador se lo
puede sacar. Y las charlas y los carteles ayudan, pero no controlan nada.

Por eso nuestra idea es hacer una opción móvil, pensada para PyMEs y hecha en Argentina, que controle durante todo
el turno, avise en el momento con la alarma y deje guardada cada falta con foto, zona y hora.

## 3. Tecnología utilizada

El robot va a tener una placa ESP32 que lo mueve por la ruta y hace sonar la alarma cuando hay una falta. Como cámara
usamos un celular con la app IP Webcam, que manda el video por WiFi a la computadora.

En la computadora corre un programa en Python con YOLO, que detecta el equipo de protección, y OpenCV, que reconoce
las caras. Las faltas se guardan en una base de datos MySQL, y la parte del servidor la hacemos con Flask. La página
web la hacemos con React, y se puede abrir tanto en la computadora como en el celular.

## 4. ¿Cómo lo solucionamos con tecnología?

**IDEA DEL PROYECTO:** un robot que recorra la fábrica con una cámara y detecte si cada trabajador tiene puesto su
equipo de protección. Si alguien no lo tiene, el robot va a hacer sonar su alarma y la alerta con foto va a llegar a
la página del empleado y a la del encargado.

**Tecnologías que podríamos usar** (marcamos las elegidas):

- ☑ API REST: para que la computadora y el robot le manden las alertas a la página.
- ☑ Páginas web: una para el encargado y otra para el empleado.
- ☑ Sensores / IoT: el robot se conecta por WiFi y tiene cámara, buzzer y sensores para no chocarse.
- ☐ Energía solar o eólica
- ☐ App para celular: preferimos una página web porque es más rápida de hacer y también se abre en el celular.
- ☑ Base de datos: para guardar cada falta con fecha, hora, zona, trabajador y foto.
- ☑ Dashboard de monitoreo: el panel del encargado con el mapa de la fábrica y las alertas.
- ☑ Arduino / Raspberry: usamos una placa ESP32, que se programa con Arduino.
- ☑ Automatización: el robot sigue una ruta y la alarma suena sola cuando hay una falta.
- ☑ Otra: inteligencia artificial para reconocer el equipo de protección y las caras.

**¿Qué necesitamos aprender para hacerlo?**

Para el robot tenemos que aprender a programar la placa ESP32 con Arduino, a manejar los motores, el buzzer y la
conexión WiFi, y a armar y cablear todo. También tenemos que aprender a usar YOLO en Python para que reconozca el
equipo de protección, y OpenCV para reconocer caras, y a pasar el video del celular a la computadora.

Para la página tenemos que aprender a hacer una API con Flask, a conectarla con una base de datos MySQL y a armar la
página con React. Además, como vamos a usar fotos de los trabajadores, tenemos que informarnos sobre la ley de datos
personales.

**¿Qué partes podría hacer cada integrante del equipo?**

Morena se va a encargar del hardware y la inteligencia artificial: armar y programar el robot, la alarma, la cámara y
el programa que detecta el equipo y reconoce las caras. Tiziano se va a encargar del software y la web: la API, la
base de datos y las páginas del encargado y del empleado. Entre los dos vamos a conectar todo, probarlo junto y
preparar la presentación.
