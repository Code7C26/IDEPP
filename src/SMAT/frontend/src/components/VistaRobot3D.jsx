// Dónde está el robot, para el empleado y el encargado: el estado real, la simulación "SMAT en la fábrica"
// y el mapa con la zona real. La simulación se aclara como tal: sus operarios y sus faltas son de ejemplo.
// Props:
//   robot            lo que devuelve la API (GET /robot/posicion o /robot/estado)
//   zonas, ruta      para el mapa (ruta: lista de zona_id en orden)
//   alertasPorZona   { zona_id: cantidad }; null si no se conocen (el empleado solo ve las suyas)
//   zonaResaltada    id de la zona que se remarca en el mapa: la del empleado (opcional)
//   simulacionAPedido  la simulación se carga recién al tocar un botón (ver RenderEmbebido)
import { textoPosicion } from '../utils/robot3d.js'
import MapaFabrica from './MapaFabrica.jsx'
import RenderEmbebido from './RenderEmbebido.jsx'

export default function VistaRobot3D({ robot, zonas = [], ruta = [], alertasPorZona = null, zonaResaltada = null, simulacionAPedido = false }) {
  return (
    <figure>
      <p role="status" className="font-medium">{textoPosicion(robot)}</p>
      <div className="mt-3">
        <MapaFabrica zonas={zonas} robot={robot} ruta={ruta} alertasPorZona={alertasPorZona} seleccionada={zonaResaltada} />
      </div>
      <figcaption className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Datos reales: la posición se conoce por zona, no al centímetro.
        {zonaResaltada && ' Tu zona es la que tiene el borde más grueso.'}
      </figcaption>
      <div className="mt-5">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
          Así trabaja el robot en la fábrica
          <span className="rounded-full bg-tinta px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Simulación</span>
        </p>
        <RenderEmbebido archivo="fabrica" titulo="Simulación del robot SMAT en la fábrica" soloEscena aPedido={simulacionAPedido} />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Con operarios de ejemplo: no muestra tu fábrica ni al robot real.</p>
      </div>
    </figure>
  )
}
