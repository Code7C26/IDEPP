// El render del robot con sus datos reales, para el empleado y el encargado.
// El cartel dice dónde está y el modelo muestra su estado: las orugas giran solo si está recorriendo, la
// pantalla cambia, la baliza titila en emergencia y sin conexión se ve gris. Dónde anda se ve en el mapa.
// Props:
//   robot            lo que devuelve la API (GET /robot/posicion o /robot/estado)
//   zonas, ruta      para el mapa (ruta: lista de zona_id en orden)
//   alertasPorZona   { zona_id: cantidad }; null si no se conocen (el empleado solo ve las suyas)
//   zonaResaltada    id de la zona que se remarca en el mapa: la del empleado (opcional)
import { estadoDelRender, textoPosicion } from '../utils/robot3d.js'
import MapaFabrica from './MapaFabrica.jsx'
import Escenario, { BotonesVista, useVista } from './robot3d/Escenario.jsx'

export default function VistaRobot3D({ robot, zonas = [], ruta = [], alertasPorZona = null, zonaResaltada = null }) {
  const vista = useVista()
  const { tono, ...estado } = estadoDelRender(robot)

  return (
    <figure>
      <Escenario estado={estado} tono={tono} texto={textoPosicion(robot)} vista={vista} />
      <div className="mt-3 flex flex-wrap gap-2"><BotonesVista vista={vista} /></div>
      <div className="mt-4">
        <MapaFabrica zonas={zonas} robot={robot} ruta={ruta} alertasPorZona={alertasPorZona} seleccionada={zonaResaltada} />
      </div>
      <figcaption className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        El mapa muestra en qué zona está el robot: la posición se conoce por zona, no al centímetro.
        {zonaResaltada && ' Tu zona es la que tiene el borde más grueso.'}
      </figcaption>
    </figure>
  )
}
