// Todas las alertas de la fábrica: filtros, tabla (PC) o tarjetas (celular), detalle y resolver.
// Si se entra desde el mapa del panel, viene con la zona ya elegida (?zona_id=2).
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getIncidents, getUsers, getZones, resolveIncident } from '../../api/client.js'
import AlertCard from '../../components/AlertCard.jsx'
import Avatar from '../../components/Avatar.jsx'
import ContadorComentarios from '../../components/ContadorComentarios.jsx'
import DetalleAlerta from '../../components/DetalleAlerta.jsx'
import Etiqueta, { tonoDeEstado } from '../../components/Etiqueta.jsx'
import Filtros from '../../components/Filtros.jsx'
import Modal from '../../components/Modal.jsx'
import Paginador from '../../components/Paginador.jsx'
import Tabla from '../../components/Tabla.jsx'
import Titulo from '../../components/Titulo.jsx'
import { useAvisos } from '../../context/AvisosContext.jsx'
import useDemora from '../../hooks/useDemora.js'
import usePolling from '../../hooks/usePolling.js'
import { botonPrimario, botonSecundario, mensajeError } from '../../utils/estilos.js'
import { formatearFecha, haceCuanto, nombreTipo, porcentaje } from '../../utils/formato.js'

const POR_PAGINA = 15
const TIPOS = ['sin_casco', 'sin_guantes', 'sin_lentes', 'sin_chaleco'].map((t) => ({ valor: t, texto: nombreTipo(t) }))
// Columna de la tabla -> nombre del orden en la API (?orden=)
const ORDEN_API = { timestamp: 'timestamp', zona: 'zona', empleado_nombre: 'empleado', tipo: 'tipo', confianza: 'confianza', estado: 'estado' }

export default function Incidencias() {
  const avisar = useAvisos()
  const [params] = useSearchParams()
  const [filtros, setFiltros] = useState({ q: '', zona_id: params.get('zona_id') || '', empleado_id: '', tipo: '', estado: '', desde: '', hasta: '' })
  const [orden, setOrden] = useState({ clave: 'timestamp', asc: false })   // por defecto: las más nuevas primero
  const [pagina, setPagina] = useState(1)
  const [elegida, setElegida] = useState(null)
  const [resolviendo, setResolviendo] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  const zonas = usePolling(() => getZones(), 0)
  const empleados = usePolling(() => getUsers({ rol: 'empleado' }), 0)
  const busqueda = useDemora(filtros.q)   // espera a que se deje de escribir para buscar
  const consulta = { ...filtros, q: busqueda, orden: `${orden.asc ? '' : '-'}${ORDEN_API[orden.clave]}`, page: pagina, limit: POR_PAGINA }
  const lista = usePolling(() => getIncidents(consulta), 8000, [JSON.stringify(consulta)])

  const filas = lista.datos?.incidencias || []
  const total = lista.datos?.total ?? 0

  const campos = [
    { nombre: 'q', etiqueta: 'Buscar', tipo: 'texto', placeholder: 'Empleado o zona' },
    { nombre: 'zona_id', etiqueta: 'Zona', tipo: 'select', opciones: (zonas.datos?.zonas || []).map((z) => ({ valor: z.id, texto: z.nombre })) },
    { nombre: 'empleado_id', etiqueta: 'Empleado', tipo: 'select', opciones: (empleados.datos?.usuarios || []).map((u) => ({ valor: u.id, texto: u.nombre })) },
    { nombre: 'tipo', etiqueta: 'Qué faltaba', tipo: 'select', opciones: TIPOS },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: [{ valor: 'activa', texto: 'Activas' }, { valor: 'resuelta', texto: 'Resueltas' }] },
    { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' },
  ]

  const resolver = async (id) => {
    setErrorAccion('')
    setResolviendo(true)
    try {
      await resolveIncident(id)
      setElegida(null)
      lista.recargar()
      avisar('Alerta marcada como resuelta')
    } catch (e) {
      setErrorAccion(e.message)
    } finally {
      setResolviendo(false)
    }
  }

  const columnas = [
    { clave: 'timestamp', titulo: 'Cuándo', ordenable: true, render: (i) => (
      <span className="block whitespace-nowrap">
        {formatearFecha(i.timestamp)}
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{haceCuanto(i.timestamp)}</span>
      </span>
    ) },
    { clave: 'zona', titulo: 'Zona', ordenable: true },
    { clave: 'empleado_nombre', titulo: 'Empleado', ordenable: true, render: (i) => (
      <span className="flex items-center gap-2.5"><Avatar nombre={i.empleado_nombre} tamano="sm" />{i.empleado_nombre}</span>
    ) },
    { clave: 'tipo', titulo: 'Qué faltaba', ordenable: true, render: (i) => nombreTipo(i.tipo) },
    { clave: 'confianza', titulo: 'Confianza', ordenable: true, clase: 'tabular-nums', render: (i) => porcentaje(i.confianza) },
    { clave: 'estado', titulo: 'Estado', ordenable: true, render: (i) => (
      <span className="inline-flex items-center gap-2">
        <Etiqueta tono={tonoDeEstado(i.estado)} punto={i.estado === 'activa'}>{i.estado}</Etiqueta>
        <ContadorComentarios cantidad={i.cantidad_comentarios} />
      </span>
    ) },
    { clave: 'acciones', titulo: '', clase: 'text-right', render: (i) => (
      <button type="button" className="rounded-md px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800" onClick={() => setElegida(i)}>Ver detalle</button>
    ) },
  ]

  return (
    <>
      <Titulo titulo="Incidencias" subtitulo={lista.cargando && !lista.datos ? 'Cargando…' : `${total} en total`} />
      <Filtros campos={campos} valores={filtros} onCambiar={(f) => { setPagina(1); setFiltros(f) }} />

      {(lista.error || errorAccion) && <p role="alert" className={`mt-4 ${mensajeError}`}>{lista.error || errorAccion}</p>}

      <div className="mt-4 hidden lg:block">
        <Tabla columnas={columnas} filas={filas} vacio="No hay alertas con esos filtros" orden={orden} onOrdenar={(o) => { setPagina(1); setOrden(o) }} />
      </div>
      <div className="mt-4 space-y-2 lg:hidden">
        {!lista.cargando && filas.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900">No hay alertas con esos filtros.</p>}
        {filas.map((inc) => <AlertCard key={inc.id} incidencia={inc} onResolver={resolver} onVer={setElegida} />)}
      </div>

      <Paginador pagina={pagina} total={total} porPagina={POR_PAGINA} onCambiar={setPagina} />

      <Modal abierto={Boolean(elegida)} titulo="Detalle de la alerta" onCerrar={() => setElegida(null)}
             pie={elegida && (
               <>
                 <button type="button" className={botonSecundario} onClick={() => setElegida(null)}>Cerrar</button>
                 {elegida.estado === 'activa' && (
                   <button type="button" className={botonPrimario} disabled={resolviendo} onClick={() => resolver(elegida.id)}>
                     {resolviendo ? 'Resolviendo…' : 'Marcar como resuelta'}
                   </button>
                 )}
               </>
             )}>
        {elegida && <DetalleAlerta incidencia={elegida} />}
      </Modal>
    </>
  )
}
