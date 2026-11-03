// Textos y controles del render 3D del robot.
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

// Cómo se ve el modelo según el robot real. No inventa movimiento: las orugas giran solo si está recorriendo.
// La pantalla no dice "CASCO OK": la web no sabe si el trabajador que tiene adelante lo lleva puesto.
export function estadoDelRender(robot) {
  if (!robot?.conectado) return { pantalla: 'apagado', alerta: false, orugas: false, apagado: true, tono: 'apagado' }
  if (robot.estado === 'emergencia') return { pantalla: 'emergencia', alerta: true, orugas: false, apagado: false, tono: 'alerta' }
  if (robot.estado === 'recorriendo') return { pantalla: 'escaneando', alerta: false, orugas: true, apagado: false, tono: 'ok' }
  return { pantalla: 'espera', alerta: false, orugas: false, apagado: false, tono: 'aviso' }
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
