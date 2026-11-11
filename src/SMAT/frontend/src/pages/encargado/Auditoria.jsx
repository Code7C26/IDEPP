// Auditoría: quién hizo qué y cuándo (resolver alertas, órdenes al robot, cambios de empleados y zonas,
// paradas de máquina, descargas...). En PC es una tabla; en el celular, una lista de tarjetas.
import { useState } from 'react'
import { getAuditoria } from '../../api/client.js'
import Avatar from '../../components/Avatar.jsx'
import Etiqueta from '../../components/Etiqueta.jsx'
import Filtros from '../../components/Filtros.jsx'
import Icono from '../../components/Icono.jsx'
import Paginador from '../../components/Paginador.jsx'
import Tabla from '../../components/Tabla.jsx'
import Titulo from '../../components/Titulo.jsx'
import useDemora from '../../hooks/useDemora.js'
import usePolling from '../../hooks/usePolling.js'
import { accionLegible } from '../../utils/auditoria.js'
import { mensajeError, tarjeta, textoSuave } from '../../utils/estilos.js'
import { formatearFecha, haceCuanto } from '../../utils/formato.js'

const POR_PAGINA = 25

// Quién lo hizo: una persona, o el "Sistema" (las máquinas: la IA o el robot)
function Quien({ registro }) {
  if (!registro.usuario_id) {
    return <span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><Icono nombre="robot" className="size-4" /></span>Sistema</span>
  }
  return <span className="flex items-center gap-2"><Avatar nombre={registro.usuario_nombre} tamano="sm" />{registro.usuario_nombre}</span>
}

function Accion({ accion }) {
  const { texto, tono } = accionLegible(accion)
  return <Etiqueta tono={tono}>{texto}</Etiqueta>
}

const COLUMNAS = [
  { clave: 'created_at', titulo: 'Cuándo', clase: 'whitespace-nowrap', render: (r) => (
    <span title={haceCuanto(r.created_at)}>{formatearFecha(r.created_at)}</span>
  ) },
  { clave: 'usuario_nombre', titulo: 'Quién', render: (r) => <Quien registro={r} /> },
  { clave: 'accion', titulo: 'Qué hizo', render: (r) => <Accion accion={r.accion} /> },
  { clave: 'detalle', titulo: 'Detalle', clase: 'text-zinc-600 dark:text-zinc-300' },
]

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ q: '', accion: '', usuario_id: '', desde: '', hasta: '' })
  const [pagina, setPagina] = useState(1)
  const busqueda = useDemora(filtros.q)   // espera a que se deje de escribir para buscar
  const consulta = { ...filtros, q: busqueda, page: pagina, limit: POR_PAGINA }
  const lista = usePolling(() => getAuditoria(consulta), 15000, [JSON.stringify(consulta)])

  const registros = lista.datos?.registros || []
  const total = lista.datos?.total ?? 0
  const campos = [
    { nombre: 'q', etiqueta: 'Buscar', tipo: 'texto', placeholder: 'En el detalle' },
    { nombre: 'accion', etiqueta: 'Qué hizo', tipo: 'select',
      opciones: (lista.datos?.acciones || []).map((a) => ({ valor: a, texto: accionLegible(a).texto })) },
    { nombre: 'usuario_id', etiqueta: 'Quién', tipo: 'select',
      opciones: [{ valor: 'sistema', texto: 'Sistema (máquinas)' },
                 ...(lista.datos?.usuarios || []).map((u) => ({ valor: u.id, texto: u.nombre }))] },
    { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' },
  ]

  return (
    <>
      <Titulo titulo="Auditoría" subtitulo={lista.cargando && !lista.datos ? 'Cargando…' : `Quién hizo qué y cuándo · ${total} ${total === 1 ? 'registro' : 'registros'}`} />
      <Filtros campos={campos} valores={filtros} onCambiar={(f) => { setPagina(1); setFiltros(f) }} />
      {lista.error && <p role="alert" className={`mt-4 ${mensajeError}`}>{lista.error}</p>}

      <div className="mt-4 hidden lg:block">
        <Tabla columnas={COLUMNAS} filas={registros} vacio="No hay registros con esos filtros" />
      </div>
      <ul className="mt-4 space-y-2 lg:hidden">
        {!lista.cargando && registros.length === 0 && <li className={`${tarjeta} text-center text-sm ${textoSuave}`}>No hay registros con esos filtros.</li>}
        {registros.map((r) => (
          <li key={r.id} className={`${tarjeta} !p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Accion accion={r.accion} />
              <span className={`text-xs ${textoSuave}`} title={formatearFecha(r.created_at)}>{haceCuanto(r.created_at)}</span>
            </div>
            <div className="mt-2 text-sm"><Quien registro={r} /></div>
            {r.detalle && <p className={`mt-2 text-sm break-words ${textoSuave}`}>{r.detalle}</p>}
          </li>
        ))}
      </ul>

      <Paginador pagina={pagina} total={total} porPagina={POR_PAGINA} onCambiar={setPagina} />
    </>
  )
}
