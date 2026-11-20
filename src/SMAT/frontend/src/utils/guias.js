// Pasos de la guía interactiva (el recorrido que se abre con el botón "?").
// Cada paso resalta un elemento de la página que tenga el atributo data-guia="<objetivo>".
// Si el elemento no está a la vista (por ejemplo, el menú de la PC cuando estás en el celular),
// el paso se muestra igual, en el centro de la pantalla.
// Los textos van en español (es) y en inglés (en): se usa el del idioma elegido.

const BIENVENIDA_PUBLICA = [
  { objetivo: 'logo',
    titulo: { es: '¡Hola! Esto es DROID-E3D', en: 'Hi! This is DROID-E3D' },
    texto: { es: 'Un robot que recorre la fábrica y se fija con inteligencia artificial si cada persona tiene puesto su equipo de protección.',
             en: 'A robot that patrols the factory and uses artificial intelligence to check that everyone is wearing their protective equipment.' } },
  { objetivo: 'secciones',
    titulo: { es: 'Conocé el proyecto', en: 'Learn about the project' },
    texto: { es: 'Desde acá podés ver cómo funciona, jugar con el robot, ver los planes y conocernos.',
             en: 'From here you can see how it works, play with the robot, check the plans and meet us.' } },
  { objetivo: 'idioma',
    titulo: { es: 'Español o inglés', en: 'Spanish or English' },
    texto: { es: 'Tocá este botón para cambiar el idioma de la página cuando quieras.',
             en: 'Tap this button to switch the page language at any time.' } },
  { objetivo: 'tema',
    titulo: { es: 'Modo claro u oscuro', en: 'Light or dark mode' },
    texto: { es: 'Con la luna (o el sol) cambiás los colores de la página para verla más cómoda.',
             en: 'The moon (or sun) changes the page colors so it is easier on your eyes.' } },
  { objetivo: 'ingresar',
    titulo: { es: 'Entrar al sistema', en: 'Log in' },
    texto: { es: 'Si trabajás en una planta que usa DROID-E3D, entrá con el usuario y la contraseña que te dio el encargado.',
             en: 'If you work at a plant that uses DROID-E3D, log in with the username and password your supervisor gave you.' } },
]

const LOGIN = [
  { objetivo: 'usuario',
    titulo: { es: 'Tu usuario', en: 'Your username' },
    texto: { es: 'Escribí el usuario que te dio el encargado de tu planta (por ejemplo, tu nombre).',
             en: 'Type the username your plant supervisor gave you (for example, your first name).' } },
  { objetivo: 'contrasena',
    titulo: { es: 'Tu contraseña', en: 'Your password' },
    texto: { es: 'Escribí tu contraseña. Si te la olvidaste, pedile al encargado que te dé una nueva.',
             en: 'Type your password. If you forgot it, ask your supervisor for a new one.' } },
  { objetivo: 'boton-ingresar',
    titulo: { es: 'Listo', en: 'Done' },
    texto: { es: 'Tocá Ingresar. El sistema te lleva solo a tu inicio, según seas empleado o encargado.',
             en: 'Tap Log in. The system takes you to your home page depending on whether you are an employee or a supervisor.' } },
]

// Botones que están en todas las páginas con sesión (abajo a la izquierda en la PC, arriba en el celular)
const BARRA = [
  { objetivo: 'menu',
    titulo: { es: 'El menú', en: 'The menu' },
    texto: { es: 'Desde acá te movés por las secciones. En el celular el menú está abajo.',
             en: 'Use this to move between sections. On a phone the menu is at the bottom.' } },
  { objetivo: 'sonido',
    titulo: { es: 'Sonido de alertas', en: 'Alert sound' },
    texto: { es: 'Si está activado, la página hace sonar una alarma cuando llega una alerta nueva.',
             en: 'When it is on, the page plays an alarm whenever a new alert arrives.' } },
  { objetivo: 'idioma',
    titulo: { es: 'Idioma', en: 'Language' },
    texto: { es: 'Cambiá entre español e inglés con este botón.',
             en: 'Switch between Spanish and English with this button.' } },
  { objetivo: 'salir',
    titulo: { es: 'Cerrar sesión', en: 'Log out' },
    texto: { es: 'Cuando termines, tocá acá para salir. Es importante si usás una compu compartida.',
             en: 'When you finish, tap here to log out. This matters if you share the computer.' } },
]

const EMPLEADO = [
  { objetivo: 'estado',
    titulo: { es: 'Cómo estás hoy', en: 'How you are doing today' },
    texto: { es: 'Si el cartel está en verde, todo en orden. Si está en rojo, el robot te vio sin algún elemento de protección: revisá tu equipo.',
             en: 'Green means everything is fine. Red means the robot saw you without some protective equipment: check your gear.' } },
  { objetivo: 'numeros',
    titulo: { es: 'Tus números', en: 'Your numbers' },
    texto: { es: 'Tu cumplimiento del último mes, cuántos días seguidos llevás sin alertas y cuántas te quedan por resolver.',
             en: 'Your compliance over the last month, how many days in a row you have gone without alerts and how many are still open.' } },
  { objetivo: 'zona',
    titulo: { es: 'Tu zona', en: 'Your area' },
    texto: { es: 'Acá ves en qué sector trabajás y qué equipo de protección es obligatorio ahí.',
             en: 'This shows the area you work in and the protective equipment required there.' } },
  { objetivo: 'robot',
    titulo: { es: 'Dónde está el robot', en: 'Where the robot is' },
    texto: { es: 'El mapa muestra por dónde anda el robot ahora y la ruta que sigue.',
             en: 'The map shows where the robot is right now and the route it follows.' } },
  ...BARRA,
]

const ENCARGADO = [
  { objetivo: 'numeros',
    titulo: { es: 'El resumen', en: 'The summary' },
    texto: { es: 'Alertas activas, las de hoy y las de la semana. Se actualiza solo cada pocos segundos.',
             en: 'Open alerts, today\'s alerts and this week\'s. It refreshes by itself every few seconds.' } },
  { objetivo: 'mapa',
    titulo: { es: 'El mapa de la fábrica', en: 'The factory map' },
    texto: { es: 'Cada zona se pinta de rojo si tiene alertas. Tocá una zona para ver el detalle.',
             en: 'Each area turns red if it has alerts. Tap an area to see the details.' } },
  { objetivo: 'ultimas',
    titulo: { es: 'Últimas alertas', en: 'Latest alerts' },
    texto: { es: 'Cada alerta trae la foto, el empleado y lo que le faltaba. Desde Incidencias las marcás como resueltas.',
             en: 'Each alert comes with the photo, the employee and what was missing. You mark them as resolved in Incidents.' } },
  ...BARRA,
]

// Elige los pasos según la página en la que estás y el rol del usuario
export function pasosDeGuia(ruta, usuario) {
  if (ruta === '/login') return LOGIN
  if (!ruta.startsWith('/app')) return BIENVENIDA_PUBLICA
  if (usuario?.rol === 'encargado') return ruta === '/app/panel' ? ENCARGADO : BARRA
  return ruta === '/app' ? EMPLEADO : BARRA
}
