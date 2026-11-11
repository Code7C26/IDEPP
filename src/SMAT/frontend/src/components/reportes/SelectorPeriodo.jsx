// Período de los reportes: atajos (7, 30 o 90 días) o fechas elegidas a mano.
// periodo = { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD' }. Lo que va en children (ej. botones de descarga) queda a la derecha.
import { campo } from '../../utils/estilos.js'
import { fechaHaceDias, fechaISO } from '../../utils/formato.js'

const ATAJOS = [7, 30, 90]

// Los últimos N días contando hoy
export const periodoDeDias = (dias) => ({ desde: fechaHaceDias(dias - 1), hasta: fechaISO(new Date()) })

export default function SelectorPeriodo({ periodo, onCambiar, children }) {
  const hoy = fechaISO(new Date())
  const atajoActivo = ATAJOS.find((dias) => {
    const p = periodoDeDias(dias)
    return p.desde === periodo.desde && p.hasta === periodo.hasta
  })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div role="group" aria-label="Período" className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
        {ATAJOS.map((dias) => (
          <button key={dias} type="button" aria-pressed={atajoActivo === dias} onClick={() => onCambiar(periodoDeDias(dias))}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${atajoActivo === dias
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
            {dias} días
          </button>
        ))}
      </div>
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Desde
        <input type="date" className={`${campo} mt-1`} value={periodo.desde} max={periodo.hasta}
               onChange={(e) => e.target.value && onCambiar({ ...periodo, desde: e.target.value })} />
      </label>
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Hasta
        <input type="date" className={`${campo} mt-1`} value={periodo.hasta} min={periodo.desde} max={hoy}
               onChange={(e) => e.target.value && onCambiar({ ...periodo, hasta: e.target.value })} />
      </label>
      {children && <div className="ml-auto flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
