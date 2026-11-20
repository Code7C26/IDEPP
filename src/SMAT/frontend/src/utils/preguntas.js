// Preguntas frecuentes del asistente de la página pública (components/publico/Asistente.jsx).
// Cada respuesta sale de lo que ya dice la web (Planes, Cómo funciona, Nosotros): si cambia un precio o una
// función, hay que cambiarla también acá. Va en español (es) y en inglés (en).
// palabras: si alguien escribe su pregunta, se elige la respuesta que tenga más de estas palabras.

export const PREGUNTAS = [
  {
    pregunta: { es: '¿Qué es DROID-E3D?', en: 'What is DROID-E3D?' },
    respuesta: {
      es: 'Un robot con orugas que recorre la fábrica con una cámara. Una inteligencia artificial revisa si cada persona tiene puesto su equipo de protección y, si falta algo, avisa al instante.',
      en: 'A tracked robot that patrols the factory with a camera. Artificial intelligence checks that everyone is wearing their protective equipment and, if something is missing, sends an instant alert.',
    },
    palabras: ['que es', 'robot', 'droid', 'what', 'about'],
  },
  {
    pregunta: { es: '¿Qué detecta?', en: 'What does it detect?' },
    respuesta: {
      es: 'Casco, guantes, lentes y chaleco. Cada zona tiene su equipo obligatorio, y el robot revisa el de la zona en la que está.',
      en: 'Helmet, gloves, goggles and vest. Each area has its own required equipment, and the robot checks the one for the area it is in.',
    },
    palabras: ['detecta', 'casco', 'guantes', 'lentes', 'chaleco', 'epp', 'detect', 'helmet', 'gloves', 'vest'],
  },
  {
    pregunta: { es: '¿Qué pasa si alguien no tiene su equipo?', en: 'What happens if someone is missing their equipment?' },
    respuesta: {
      es: 'El robot se detiene en la zona, muestra el signo de peligro y hace sonar la alarma. Al mismo tiempo, la alerta llega con foto al celular del encargado y del empleado. Las máquinas de la fábrica no se tocan.',
      en: 'The robot stops in the area, shows the danger sign and sounds the alarm. At the same time, the alert reaches the supervisor and the employee on their phones, with a photo. The factory machines are not touched.',
    },
    palabras: ['pasa', 'falta', 'alarma', 'alerta', 'sin equipo', 'happens', 'missing', 'alarm', 'alert'],
  },
  {
    pregunta: { es: '¿Cuánto cuesta?', en: 'How much does it cost?' },
    respuesta: {
      es: 'El Plan Compra cuesta $1.400.000 de pago único más $75.000 por mes, con plataforma, soporte y mantenimiento. Si la planta no tiene una computadora que sirva para la IA, se suma una mini PC por $350.000. El detalle está en Planes.',
      en: 'The Purchase Plan costs ARS 1,400,000 once plus ARS 75,000 a month, including the platform, support and maintenance. If the plant has no computer that can run the AI, a mini PC is added for ARS 350,000. See Plans for details.',
    },
    palabras: ['cuesta', 'precio', 'plan', 'pagar', 'abono', 'cost', 'price', 'pay'],
    enlace: { ruta: '/planes', texto: { es: 'Ver los planes', en: 'See the plans' } },
  },
  {
    pregunta: { es: '¿Qué pasa con las fotos de las caras?', en: 'What about photos of faces?' },
    respuesta: {
      es: 'Las fotos de la cara se cargan solo con el consentimiento del empleado (Ley 25.326). Cada empleado ve sus fotos y las puede borrar desde su perfil, y ninguna foto es pública.',
      en: 'Face photos are only added with the employee\'s consent (Argentine Law 25,326). Each employee can see their photos and delete them from their profile, and no photo is public.',
    },
    palabras: ['foto', 'cara', 'privacidad', 'datos', 'consentimiento', 'photo', 'face', 'privacy', 'data'],
  },
  {
    pregunta: { es: '¿Cómo pido una demo?', en: 'How do I request a demo?' },
    respuesta: {
      es: 'Desde Contacto nos dejás tus datos y te mostramos el robot, la alerta con foto y la alarma en una demo de 20 minutos.',
      en: 'Leave your details on the Contact page and we will show you the robot, the photo alert and the alarm in a 20-minute demo.',
    },
    palabras: ['demo', 'contacto', 'probar', 'ver', 'contact', 'try'],
    enlace: { ruta: '/contacto', texto: { es: 'Ir a Contacto', en: 'Go to Contact' } },
  },
]

// Busca la pregunta que mejor coincide con lo que escribió la persona (null si no se parece a ninguna)
export function buscarRespuesta(texto) {
  const limpio = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  let mejor = null
  let puntos = 0
  for (const p of PREGUNTAS) {
    const coincidencias = p.palabras.filter((palabra) => limpio.includes(palabra)).length
    if (coincidencias > puntos) { mejor = p; puntos = coincidencias }
  }
  return mejor
}
