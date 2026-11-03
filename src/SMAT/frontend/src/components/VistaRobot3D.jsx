// Vista 3D de la planta con el robot, y debajo una línea de texto que dice dónde está.
// El texto es lo que vale: el dibujo lo acompaña. Si el equipo no puede mostrar 3D (sin WebGL, o sin
// conexión para descargar Three.js) se ve el mapa de siempre.
// Props:
//   zonas, ruta (lista de zona_id en orden) y robot: los datos de la API (o los de useRobotSimulado)
//   alertasPorZona   { zona_id: cantidad }; null si no se conocen (el empleado solo ve las suyas)
//   zonaResaltada    id de la zona que se marca como "Tu zona" (opcional)
//   alerta           el robot acaba de detectar una falta (opcional)
//   simulada         muestra el cartel "Simulación"
//   texto            reemplaza a la línea de texto (opcional)
import { Component, lazy, Suspense, useState } from 'react'
import { hayWebgl, textoPosicion } from '../utils/robot3d.js'
import MapaFabrica from './MapaFabrica.jsx'

const PlantaRobot3D = lazy(() => import('./robot3d/PlantaRobot3D.jsx'))

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

const gesto = () => (window.matchMedia('(pointer: coarse)').matches ? 'Girá la vista con dos dedos.' : 'Arrastrá para girar la vista.')

export default function VistaRobot3D({ zonas = [], ruta = [], robot, alertasPorZona = null, zonaResaltada = null, alerta = false, simulada = false, texto }) {
  const [con3d, setCon3d] = useState(hayWebgl)
  const datos = { zonas, ruta, robot, alertasPorZona, zonaResaltada, alerta }

  return (
    <figure>
      {con3d ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-200 sm:aspect-[16/10] dark:bg-zinc-800">
          <SiFalla onFallo={() => setCon3d(false)}>
            <Suspense fallback={<p className="grid size-full place-items-center text-sm text-zinc-500 dark:text-zinc-400">Preparando la vista 3D…</p>}>
              <PlantaRobot3D datos={datos} onFallo={() => setCon3d(false)} />
            </Suspense>
          </SiFalla>
          {simulada && <span className="absolute top-3 left-3 rounded-full bg-tinta px-3 py-1 text-xs font-semibold text-white">Simulación</span>}
        </div>
      ) : (
        <div className="relative">
          <MapaFabrica zonas={zonas} robot={robot} ruta={ruta} alertasPorZona={alertasPorZona} />
          {simulada && <span className="absolute top-3 left-3 rounded-full bg-tinta px-3 py-1 text-xs font-semibold text-white">Simulación</span>}
        </div>
      )}
      <figcaption className="mt-3">
        <p role="status" className="font-medium">{texto || textoPosicion(robot)}</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          La posición se muestra por zona; el paso de una a otra es una animación.{con3d && ` ${gesto()}`}
        </p>
      </figcaption>
    </figure>
  )
}
