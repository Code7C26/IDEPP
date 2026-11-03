// El cuadro del render, con el mismo diseño de "Robot SMAT 3D": la escena 3D, el cartel de estado arriba y
// la ayuda abajo. Si el equipo no puede mostrar 3D (sin WebGL, o sin conexión para descargar Three.js),
// queda el cartel de estado y un aviso, y la página sigue andando.
// Props: estado (ver ponerEstado en escena.js), tono ('ok' | 'alerta' | 'aviso' | 'apagado'), texto, vista (de useVista).
import { Component, lazy, Suspense, useState } from 'react'
import { hayWebgl } from '../../utils/robot3d.js'

const EscenaRobot = lazy(() => import('./EscenaRobot.jsx'))

const TONOS = { ok: 'bg-[#2f8f4e]', alerta: 'bg-[#d7262b]', aviso: 'bg-[#b5730a]', apagado: 'bg-[#5d6459]' }

// Botones del render (los mismos del original)
export const botonRobot = 'cursor-pointer border-2 border-[#1d211c] bg-white px-3.5 py-2.5 text-left font-robot text-sm font-semibold text-[#1d211c] outline-offset-2 hover:bg-[#f2b705] focus-visible:outline-3 focus-visible:outline-[#f2b705] dark:border-[#eceee8] dark:bg-[#1f231f] dark:text-[#eceee8] dark:hover:border-[#1d211c] dark:hover:bg-[#f2b705] dark:hover:text-[#1d211c]'
export const botonRobotAlerta = 'cursor-pointer border-2 border-[#d7262b] bg-[#d7262b] px-3.5 py-2.5 text-left font-robot text-sm font-semibold text-white outline-offset-2 hover:brightness-110 focus-visible:outline-3 focus-visible:outline-[#f2b705]'

const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Estado de los botones de la vista: giro automático y "Vista de frente"
export function useVista() {
  const [girando, setGirando] = useState(() => !movimientoReducido())
  const [vistaFrente, setVistaFrente] = useState(0)
  return { girando, vistaFrente, alternarGiro: () => setGirando((g) => !g), irDeFrente: () => setVistaFrente((n) => n + 1) }
}

export function BotonesVista({ vista }) {
  return (
    <>
      <button type="button" className={botonRobot} onClick={vista.alternarGiro}>{vista.girando ? 'Pausar giro automático' : 'Activar giro automático'}</button>
      <button type="button" className={botonRobot} onClick={vista.irDeFrente}>Vista de frente</button>
    </>
  )
}

// Si no se pudo descargar la parte 3D (por ejemplo, sin conexión), avisa en vez de romper la página
class SiFalla extends Component {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch() {
    this.props.onFallo()
  }

  render() {
    return this.state.fallo ? null : this.props.children
  }
}

const ayuda = () => (window.matchMedia('(pointer: coarse)').matches ? 'dos dedos = girar y zoom' : 'arrastrar = girar · ctrl + rueda = zoom')

export default function Escenario({ estado, tono, texto, vista }) {
  const [con3d, setCon3d] = useState(hayWebgl)
  const cartel = `font-robot-mono text-xs font-medium tracking-[.08em] text-white uppercase ${TONOS[tono]} px-2.5 py-1`

  if (!con3d) {
    return (
      <div>
        <p role="status" className={`inline-block ${cartel}`}>{texto}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Este equipo no puede mostrar el modelo 3D del robot.</p>
      </div>
    )
  }
  return (
    <div className="relative aspect-[4/3] max-w-full min-w-0 overflow-hidden border border-[#d5d9cf] bg-white dark:border-[#343a33] dark:bg-[#1f231f]">
      <SiFalla onFallo={() => setCon3d(false)}>
        <Suspense fallback={<p className="grid size-full place-items-center text-sm text-zinc-500 dark:text-zinc-400">Preparando el modelo 3D…</p>}>
          <EscenaRobot estado={estado} girando={vista.girando} vistaFrente={vista.vistaFrente} onFallo={() => setCon3d(false)} />
        </Suspense>
      </SiFalla>
      <p role="status" className={`absolute top-3 left-3 mr-3 ${cartel}`}>{texto}</p>
      <p className="pointer-events-none absolute bottom-2.5 left-3 font-robot-mono text-xs font-medium text-[#5d6459] dark:text-[#a2a99c]">{ayuda()}</p>
    </div>
  )
}
