// Ranking de cumplimiento (empleados o zonas): barra, porcentaje y nivel en texto ("Bien", "A mejorar", "Riesgo").
//  - tipo: 'empleados' o 'zonas' (cambia la primera columna)
// En el celular se ocultan las columnas secundarias para que entren el nombre y el cumplimiento.
import { nivelCumplimiento } from '../../utils/graficos.js'
import Avatar from '../Avatar.jsx'
import Etiqueta from '../Etiqueta.jsx'
import Tabla from '../Tabla.jsx'

function Medidor({ valor }) {
  const nivel = nivelCumplimiento(valor)
  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-100 sm:block dark:bg-zinc-800" aria-hidden="true">
        <div className={`h-full rounded-full ${nivel.barra}`} style={{ width: `${valor}%` }} />
      </div>
      <span className="w-10 text-right font-medium tabular-nums">{valor}%</span>
      <Etiqueta tono={nivel.tono}>{nivel.texto}</Etiqueta>
    </div>
  )
}

const SOLO_PC = 'hidden md:table-cell'
const numero = (clave, titulo) => ({ clave, titulo, ordenable: true, clase: `text-right tabular-nums ${SOLO_PC}` })

const COLUMNAS = {
  empleados: [
    { clave: 'nombre', titulo: 'Empleado', ordenable: true, render: (e) => (
      <div className="flex items-center gap-2.5">
        <Avatar nombre={e.nombre} tamano="sm" />
        <div className="min-w-0"><p className="truncate font-medium">{e.nombre}</p><p className="text-xs text-zinc-500 dark:text-zinc-400">{e.legajo}</p></div>
      </div>
    ) },
    { clave: 'zona', titulo: 'Zona', ordenable: true, clase: SOLO_PC, render: (e) => e.zona || '—' },
  ],
  zonas: [
    { clave: 'nombre', titulo: 'Zona', ordenable: true, render: (z) => <span className="font-medium">{z.nombre}</span> },
    numero('empleados', 'Empleados'),
  ],
}

export default function TablaRanking({ tipo, filas }) {
  const columnas = [
    ...COLUMNAS[tipo],
    numero('alertas', 'Alertas'),
    numero('dias_con_alerta', 'Días con alerta'),
    { clave: 'cumplimiento', titulo: 'Cumplimiento', ordenable: true, render: (f) => <Medidor valor={f.cumplimiento} /> },
  ]
  return <Tabla columnas={columnas} filas={filas} claveFila="id" vacio={tipo === 'empleados' ? 'No hay empleados activos' : 'No hay zonas'} />
}
