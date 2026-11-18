// Tarjeta de la zona del empleado: su máquina o puesto y el EPP que se exige.
// zona = lo que devuelve GET /api/me en "zona_detalle" (o null si no tiene zona asignada).
import { NOMBRES_EPP } from '../utils/formato.js'
import Icono from './Icono.jsx'

export default function ZonaCard({ zona }) {
  if (!zona) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        Todavía no tenés una zona asignada. Pedile al encargado que te asigne una.
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold">{zona.nombre}</h2>
      {zona.maquina && <p className="text-sm text-zinc-500 dark:text-zinc-400">{zona.maquina}</p>}

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Equipo de protección obligatorio
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {zona.epp_requerido.length === 0 && <li className="text-sm text-zinc-500">Ninguno configurado</li>}
        {zona.epp_requerido.map((epp) => (
          <li key={epp} className="inline-flex items-center gap-1.5 rounded-lg bg-marca/15 px-3 py-1.5 text-sm font-medium">
            <Icono nombre="ok" className="size-4 text-marca-oscuro dark:text-marca" />
            {NOMBRES_EPP[epp] || epp}
          </li>
        ))}
      </ul>
    </section>
  )
}
