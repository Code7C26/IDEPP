// Columnas con las alertas de cada día del período. Al pasar el mouse muestra qué equipo faltó.
// Debajo, los mismos datos en una tabla (para quien no puede ver bien el gráfico).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTema } from '../../context/TemaContext.jsx'
import { nombreTipo } from '../../utils/formato.js'
import { COLORES, diaCorto, diaLargo } from '../../utils/graficos.js'
import CajaTooltip from './CajaTooltip.jsx'

const TIPOS = ['sin_casco', 'sin_guantes', 'sin_lentes', 'sin_chaleco']

function Detalle({ active, payload }) {
  if (!active || !payload?.length) return null
  const dia = payload[0].payload
  return (
    <CajaTooltip titulo={diaLargo(dia.fecha)}>
      <p className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">{dia.total} {dia.total === 1 ? 'alerta' : 'alertas'}</p>
      {TIPOS.filter((tipo) => dia[tipo] > 0).map((tipo) => (
        <p key={tipo} className="text-zinc-500 tabular-nums dark:text-zinc-400">{nombreTipo(tipo)}: {dia[tipo]}</p>
      ))}
    </CajaTooltip>
  )
}

export default function GraficoPorDia({ dias }) {
  const { oscuro } = useTema()
  const c = COLORES[oscuro ? 'oscuro' : 'claro']
  const conAlertas = dias.filter((d) => d.total > 0)

  return (
    <>
      <div className="h-64" role="img" aria-label={`Alertas por día: ${conAlertas.length} de ${dias.length} días tuvieron alertas`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dias} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={c.grilla} />
            <XAxis dataKey="fecha" tickFormatter={diaCorto} tick={{ fill: c.texto, fontSize: 11 }}
                   axisLine={{ stroke: c.eje }} tickLine={false} minTickGap={18} />
            <YAxis allowDecimals={false} tick={{ fill: c.texto, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<Detalle />} cursor={{ fill: c.cursor }} />
            <Bar dataKey="total" name="Alertas" fill={c.serie} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white">Ver los datos en una tabla</summary>
        {conAlertas.length === 0 ? <p className="mt-2 text-zinc-500">Ningún día tuvo alertas.</p> : (
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr><th className="py-1 font-medium">Día</th>{TIPOS.map((t) => <th key={t} className="py-1 text-right font-medium">{nombreTipo(t)}</th>)}<th className="py-1 text-right font-medium">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums dark:divide-zinc-800">
              {conAlertas.map((d) => (
                <tr key={d.fecha}><td className="py-1 first-letter:uppercase">{diaLargo(d.fecha)}</td>{TIPOS.map((t) => <td key={t} className="py-1 text-right">{d[t]}</td>)}<td className="py-1 text-right font-semibold">{d.total}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
    </>
  )
}
