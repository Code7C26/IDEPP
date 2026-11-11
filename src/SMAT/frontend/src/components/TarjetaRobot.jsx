// Resumen del robot para el panel: estado, conexión, batería y zona actual.
// robot = lo que devuelve GET /api/robot/estado (o null mientras carga).
import { Link } from 'react-router-dom'
import { haceCuanto } from '../utils/formato.js'
import { tarjeta } from '../utils/estilos.js'
import Icono from './Icono.jsx'

const ESTADOS = {
  recorriendo: 'bg-ok/10 text-ok ring-ok/30',
  pausado: 'bg-naranja/10 text-naranja ring-naranja/30',
  detenido: 'bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
  emergencia: 'bg-alerta/10 text-alerta ring-alerta/30',
}

export default function TarjetaRobot({ robot }) {
  if (!robot) return <section className={`${tarjeta} text-sm text-zinc-500`}>Cargando el robot…</section>

  const bateriaBaja = robot.conectado && robot.bateria <= 20
  // Sin conexión la batería y la zona son datos viejos; si nunca se conectó, ni siquiera hay datos
  const sinDatos = !robot.ultima_conexion
  const colorBateria = !robot.conectado ? 'bg-zinc-400' : bateriaBaja ? 'bg-alerta' : 'bg-ok'
  return (
    <section className={tarjeta}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-marca/15 text-marca-oscuro dark:text-marca"><Icono nombre="robot" /></span>
          <div>
            <h2 className="font-semibold">Robot DROID-E3D</h2>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className={`size-2 rounded-full ${robot.conectado ? 'bg-ok' : 'bg-zinc-400'}`} />
              {robot.conectado ? 'Conectado' : robot.ultima_conexion ? `Último dato ${haceCuanto(robot.ultima_conexion)} (${robot.estado})` : 'Nunca se conectó'}
            </p>
          </div>
        </div>
        {/* Sin conexión no se muestra "recorriendo": sería el último dato, no lo que pasa ahora */}
        {robot.conectado
          ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${ESTADOS[robot.estado] || ESTADOS.detenido}`}>{robot.estado}</span>
          : <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700">Sin conexión</span>}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{robot.conectado || sinDatos ? 'Batería' : 'Batería (último dato)'}</span>
          <span className={bateriaBaja ? 'font-semibold text-alerta' : ''}>{sinDatos ? 'sin datos' : `${robot.bateria}%`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" role="progressbar" aria-valuenow={sinDatos ? undefined : robot.bateria} aria-valuemin="0" aria-valuemax="100" aria-label="Batería">
          <div className={`h-full rounded-full ${colorBateria}`} style={{ width: `${sinDatos ? 0 : robot.bateria}%` }} />
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{robot.conectado ? 'Zona actual' : 'Última zona'}: <strong>{robot.zona_actual || 'sin datos'}</strong></p>
      <Link to="/app/robot" className="mt-3 inline-block text-sm font-medium text-marca-oscuro hover:underline dark:text-marca">Ir al control del robot →</Link>
    </section>
  )
}
