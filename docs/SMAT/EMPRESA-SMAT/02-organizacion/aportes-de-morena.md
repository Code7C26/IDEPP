# Registro de aportes de Morena Boeris

**Proyecto:** DROID-E3D by IDEPP · **Rol:** hardware, inteligencia artificial, documentación y marketing
**Actualizado:** 26/11/2026

En este registro está lo que hizo Morena en el proyecto. Cada punto se puede comprobar con un commit, un archivo del repositorio o una pieza terminada.

## 1. Robot (hardware y programa)

- Elegí, compré y armé las piezas del robot: ESP32-S3, servos con PCA9685, motores con orugas, pantalla ST7789, amplificador MAX98357A con parlante, pilas 18650, seguidores de línea y sensor de distancia.
- Armé el cuerpo y el cableado interno del robot que se mostró en la feria del colegio.
- Programé el robot (`src/SMAT/servidor_ia/robot_droid/`):
  - sketches de prueba del WALL-E con ESP32-S3, motores, buzzer, seguidores de línea y sensor de distancia;
  - un solo programa con dos modos: recorrido de la ruta y control remoto;
  - control remoto con joystick en el celular;
  - WiFi configurable desde el celular, sin volver a programar;
  - nombre fijo en la red, para que la IA encuentre al robot y a la cámara aunque cambie el WiFi;
  - alarma que se detiene en la zona: el robot frena y avisa.

## 2. Inteligencia artificial (`src/SMAT/servidor_ia/`)

- Entrené el primer modelo de cascos y después el modelo completo de EPP.
- Hice el programa que saca fotos con la cámara del robot para reentrenar el modelo.
- Reentrené el modelo con 308 fotos propias, etiquetadas en Roboflow y entrenadas en Colab, para casco, chaleco y lentes (`modelo_epp.pt`, 25/11/2026).
- Conecté la IA con la ESP32-CAM y la hice andar fluida sin placa de video.
- Hice que la cámara caliente menos y que cada falta se registre por separado.
- Sumé el reconocimiento facial del trabajador en las alertas.

## 3. Documentación de la empresa (`docs/SMAT/EMPRESA-SMAT/`)

- Actas de las reuniones del 10/08, 26/08, 21/10 y 05/11, y el acuerdo de socios al día.
- Bitácora completa de agosto a noviembre.
- FODA con la reflexión final, lluvia de ideas, mini pitch, avance del proyecto (de KIDO a DROID-E3D) y versión estable del MVP.
- Paso de SMAT a IDEPP con dos productos.
- Costos con las piezas reales, precio del Plan Compra y punto de equilibrio.
- Decisión de sacar el corte de máquina y su cambio en todos los documentos.
- Documento "Cómo entregamos e instalamos DROID-E3D".
- **Manual de usuario:** librito A5 de 16 páginas, con el QR al video tutorial.
- Corrección de los componentes (casco, chaleco y lentes; orugas; piezas reales) en todos los documentos.

## 4. Documento final del proyecto

- Escribí y ordené las 11 secciones de la guía del colegio en el documento final.
- Armé el PDF en formato APA con la hoja membretada del colegio y los documentos originales del equipo.

## 5. Marca y marketing

- Logo nuevo de DROID-E3D (letra D con lente) y estética naranja y crema de la web, la caja y el manual.
- Flyer de IDEPP con QR.
- Página web pública **idepp.netlify.app**, con la página del video tutorial.
- Spots de IDEPP: "Cámara IA", v2 y versión con voces.
- Video tutorial de DROID-E3D, largo y corto, en español con voz.
- Guion del spot en inglés para los cinco integrantes de IDEPP.

## 6. Lo que no se ve en el repositorio

Varias de estas piezas no están en GitHub porque no son código: el robot físico, el entrenamiento en Roboflow y Colab, los videos, el flyer, la página de Netlify y el documento final. Quedan como evidencia los archivos entregados y las fotos de la feria.
