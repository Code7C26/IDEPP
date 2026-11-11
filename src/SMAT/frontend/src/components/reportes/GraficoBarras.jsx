// Barras horizontales de una sola serie, con el valor en la punta de cada barra.
// datos: [{ nombre: 'Zona A', total: 12 }]   unidad: texto del recuadro al pasar el mouse ('alertas')
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTema } from '../../context/TemaContext.jsx'
import { COLORES } from '../../utils/graficos.js'
import CajaTooltip from './CajaTooltip.jsx'

const ALTO_FILA = 40

function Detalle({ active, payload, unidad }) {
  if (!active || !payload?.length) return null
  const fila = payload[0].payload
  return (
    <CajaTooltip titulo={fila.nombre}>
      <p className="tabular-nums text-zinc-600 dark:text-zinc-300">{fila.total} {unidad}</p>
    </CajaTooltip>
  )
}

export default function GraficoBarras({ datos, unidad = 'alertas', descripcion }) {
  const { oscuro } = useTema()
  const c = COLORES[oscuro ? 'oscuro' : 'claro']

  return (
    <div style={{ height: datos.length * ALTO_FILA + 8 }} role="img" aria-label={descripcion}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={datos} margin={{ top: 4, right: 40, left: 0, bottom: 4 }} barCategoryGap={10}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" width={92} tick={{ fill: c.texto, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Detalle unidad={unidad} />} cursor={{ fill: c.cursor }} />
          <Bar dataKey="total" fill={c.serie} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="total" position="right" fill={c.valor} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
