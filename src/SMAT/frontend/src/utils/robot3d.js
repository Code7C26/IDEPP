// Textos y controles de la vista 3D del robot.
import { haceCuanto } from './formato.js'

const ESTADOS = { recorriendo: 'Recorriendo', pausado: 'Pausado', detenido: 'Detenido', emergencia: 'EMERGENCIA' }

// Dónde está el robot, en palabras. Sin conexión lo dice claro: es el último dato, no lo que pasa ahora.
export function textoPosicion(robot) {
  if (!robot) return 'Buscando al robot…'
  if (!robot.conectado) {
    if (!robot.ultima_conexion) return 'Sin conexión · el robot nunca se conectó'
    return `Sin conexión · último dato ${haceCuanto(robot.ultima_conexion)}${robot.zona_actual ? ` en ${robot.zona_actual}` : ''}`
  }
  const estado = ESTADOS[robot.estado] || robot.estado
  return robot.zona_actual ? `En ${robot.zona_actual} · ${estado}` : `${estado} · sin zona informada`
}

// ¿El equipo puede dibujar 3D? Se revisa antes de descargar Three.js.
export function hayWebgl() {
  try {
    const canvas = document.createElement('canvas')
    const contexto = canvas.getContext('webgl2') || canvas.getContext('webgl')
    contexto?.getExtension('WEBGL_lose_context')?.loseContext()   // era solo para probar: se libera
    return Boolean(contexto)
  } catch {
    return false
  }
}
