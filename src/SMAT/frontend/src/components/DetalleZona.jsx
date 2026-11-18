// Detalle de una zona para el panel lateral del Panel: máquina o puesto, EPP obligatorio,
// alertas activas (con "Resolver") y empleados que trabajan ahí.
// Props: zona, alertas (activas de esta zona), onResolver(id)
import { Link } from 'react-router-dom'
import { getUsers } from '../api/client.js'
import usePolling from '../hooks/usePolling.js'
import { NOMBRES_EPP } from '../utils/formato.js'
import AlertCard from './AlertCard.jsx'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'

const subtitulo = 'mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

export default function DetalleZona({ zona, alertas, onResolver }) {
  const empleados = usePolling(() => getUsers({ zona_id: zona.id, rol: 'empleado', activo: 'true' }), 0, [zona.id])
  const lista = empleados.datos?.usuarios || []

  return (
    <div className="space-y-6">
      {zona.maquina && (
        <p className="flex items-center gap-2 rounded-xl border border-zinc-200 p-4 font-medium dark:border-zinc-800">
          <Icono nombre="maquina" className="size-5 text-zinc-500" />{zona.maquina}
        </p>
      )}

      <section>
        <h3 className={subtitulo}>EPP obligatorio</h3>
        <ul className="flex flex-wrap gap-2">
          {zona.epp_requerido.length === 0 && <li className="text-sm text-zinc-500">Sin EPP configurado</li>}
          {zona.epp_requerido.map((e) => (
            <li key={e} className="flex items-center gap-1.5 rounded-lg bg-marca/15 px-2.5 py-1 text-sm font-medium text-marca-oscuro dark:text-marca">
              <Icono nombre={e} className="size-4" />{NOMBRES_EPP[e] || e}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className={subtitulo}>Alertas activas ({alertas.length})</h3>
        {alertas.length === 0 && <p className="text-sm text-zinc-500">No hay alertas sin resolver.</p>}
        <div className="space-y-2">{alertas.map((inc) => <AlertCard key={inc.id} incidencia={inc} onResolver={onResolver} />)}</div>
        <Link to={`/app/incidencias?zona_id=${zona.id}`} className="mt-3 inline-block text-sm font-medium text-marca-oscuro hover:underline dark:text-marca">
          Ver todas las incidencias de la zona →
        </Link>
      </section>

      <section>
        <h3 className={subtitulo}>Empleados ({lista.length})</h3>
        {empleados.cargando && <p className="text-sm text-zinc-500">Cargando…</p>}
        {!empleados.cargando && lista.length === 0 && <p className="text-sm text-zinc-500">No hay empleados asignados.</p>}
        <ul className="space-y-2">
          {lista.map((u) => (
            <li key={u.id} className="flex items-center gap-2 text-sm"><Avatar nombre={u.nombre} tamano="sm" />{u.nombre}
              <span className="text-xs text-zinc-500">· legajo {u.legajo || '—'}</span></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
