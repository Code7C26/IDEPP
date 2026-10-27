// Gestión de empleados: alta, edición, baja y reactivación. Solo lo ve el encargado.
// La baja NO borra al empleado (se perdería su historial de alertas): lo marca como inactivo.
import { useState } from 'react'
import { createUser, deactivateUser, getUsers, getZones, updateUser } from '../../api/client.js'
import Avatar from '../../components/Avatar.jsx'
import Confirmar from '../../components/Confirmar.jsx'
import Etiqueta from '../../components/Etiqueta.jsx'
import Filtros from '../../components/Filtros.jsx'
import FormEmpleado from '../../components/FormEmpleado.jsx'
import FotosRostro from '../../components/FotosRostro.jsx'
import PanelLateral from '../../components/PanelLateral.jsx'
import Tabla from '../../components/Tabla.jsx'
import Titulo from '../../components/Titulo.jsx'
import { useAvisos } from '../../context/AvisosContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { botonPrimario, mensajeError } from '../../utils/estilos.js'

const estado = (u) => <Etiqueta tono={u.activo ? 'ok' : 'neutro'} punto>{u.activo ? 'Activo' : 'De baja'}</Etiqueta>
const persona = (u) => (
  <span className="flex items-center gap-3">
    <Avatar nombre={u.nombre} tamano="sm" />
    <span><span className="block font-medium">{u.nombre}</span><span className="block text-xs text-zinc-500">{u.legajo || 'sin legajo'}</span></span>
  </span>
)

export default function Empleados() {
  const avisar = useAvisos()
  const [filtros, setFiltros] = useState({ q: '', rol: '', zona_id: '', activo: 'true' })
  const [formulario, setFormulario] = useState(null)   // null = cerrado · {} = nuevo · empleado = editar
  const [aBaja, setABaja] = useState(null)             // empleado que se está por dar de baja
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const usuarios = usePolling(() => getUsers(), 15000)
  const zonas = usePolling(() => getZones(), 0)
  const listaZonas = zonas.datos?.zonas || []
  const todos = usuarios.datos?.usuarios || []

  // Los filtros se aplican acá (son pocos empleados): texto, rol, zona y si está activo
  const texto = filtros.q.trim().toLowerCase()
  const filas = todos.filter((u) =>
    (!texto || [u.nombre, u.usuario, u.legajo].some((v) => (v || '').toLowerCase().includes(texto)))
    && (!filtros.rol || u.rol === filtros.rol)
    && (!filtros.zona_id || String(u.zona_id) === String(filtros.zona_id))
    && (!filtros.activo || String(u.activo) === filtros.activo))

  const campos = [
    { nombre: 'q', etiqueta: 'Buscar', tipo: 'texto', placeholder: 'Nombre o legajo' },
    { nombre: 'rol', etiqueta: 'Rol', tipo: 'select', opciones: [{ valor: 'empleado', texto: 'Empleados' }, { valor: 'encargado', texto: 'Encargados' }] },
    { nombre: 'zona_id', etiqueta: 'Zona', tipo: 'select', opciones: listaZonas.map((z) => ({ valor: z.id, texto: z.nombre })) },
    { nombre: 'activo', etiqueta: 'Estado', tipo: 'select', opciones: [{ valor: 'true', texto: 'Activos' }, { valor: 'false', texto: 'De baja' }] },
  ]

  // Corre una acción del servidor: si sale bien avisa y recarga; si falla deja el error a la vista
  const ejecutar = async (accion, exito) => {
    setOcupado(true); setError('')
    try { await accion(); usuarios.recargar(); avisar(exito); return true }
    catch (e) { setError(e.message); return false }
    finally { setOcupado(false) }
  }
  const guardar = async (datos) => {
    const id = formulario?.id
    if (await ejecutar(() => (id ? updateUser(id, datos) : createUser(datos)), id ? 'Cambios guardados' : 'Empleado creado')) setFormulario(null)
  }
  const darDeBaja = async () => {
    if (await ejecutar(() => deactivateUser(aBaja.id), `${aBaja.nombre} quedó de baja`)) setABaja(null)
  }
  const reactivar = (u) => ejecutar(() => updateUser(u.id, { activo: true }), `${u.nombre} fue reactivado`)
  const abrir = (u) => { setError(''); setFormulario(u) }

  const acciones = (u) => (
    <div className="flex justify-end gap-1">
      <button type="button" className="rounded-md px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800" onClick={() => abrir(u)}>Editar</button>
      {u.activo
        ? <button type="button" className="rounded-md px-2 py-1 font-medium text-alerta hover:bg-alerta/5" onClick={() => { setError(''); setABaja(u) }}>Dar de baja</button>
        : <button type="button" className="rounded-md px-2 py-1 font-medium text-ok hover:bg-ok/5" onClick={() => reactivar(u)}>Reactivar</button>}
    </div>
  )

  const columnas = [
    { clave: 'nombre', titulo: 'Nombre', ordenable: true, render: persona },
    { clave: 'usuario', titulo: 'Usuario', ordenable: true, clase: 'hidden lg:table-cell', render: (u) => <span className="text-zinc-600 dark:text-zinc-300">@{u.usuario}</span> },
    { clave: 'rol', titulo: 'Rol', ordenable: true, clase: 'hidden lg:table-cell', render: (u) => <Etiqueta tono={u.rol === 'encargado' ? 'marca' : 'neutro'}>{u.rol}</Etiqueta> },
    { clave: 'zona', titulo: 'Zona', ordenable: true, render: (u) => u.zona || '—' },
    { clave: 'activo', titulo: 'Estado', render: estado },
    { clave: 'acciones', titulo: '', clase: 'text-right', render: acciones },
  ]

  // Si el servidor no respondió, no decimos que no hay empleados: no sabemos cuántos hay
  const vacio = usuarios.error ? 'No se pudo cargar la lista' : 'No hay empleados con esos filtros'

  return (
    <>
      <Titulo titulo="Empleados" subtitulo={usuarios.cargando && !usuarios.datos ? 'Cargando…' : `${filas.length} de ${todos.length} personas`}>
        <button type="button" className={botonPrimario} onClick={() => abrir({})}>+ Nuevo empleado</button>
      </Titulo>
      <Filtros campos={campos} valores={filtros} onCambiar={setFiltros} />
      {(usuarios.error || (error && !formulario && !aBaja)) && <p role="alert" className={`mt-4 ${mensajeError}`}>{usuarios.error || error}</p>}

      <div className="mt-4 hidden md:block"><Tabla columnas={columnas} filas={filas} vacio={vacio} /></div>
      <ul className="mt-4 space-y-2 md:hidden">
        {filas.map((u) => (
          <li key={u.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">{persona(u)}{estado(u)}</div>
            <p className="mt-2 text-sm text-zinc-600 capitalize dark:text-zinc-300">@{u.usuario} · {u.rol} · {u.zona || 'sin zona'}</p>
            <div className="mt-3 border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">{acciones(u)}</div>
          </li>
        ))}
        {filas.length === 0 && !usuarios.cargando && <li className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900">{vacio}.</li>}
      </ul>

      <PanelLateral abierto={Boolean(formulario)} onCerrar={() => setFormulario(null)}
                    titulo={formulario?.id ? `Editar a ${formulario.nombre}` : 'Nuevo empleado'}
                    descripcion={formulario?.id ? 'Los cambios se aplican al guardar.' : 'Con el usuario y la contraseña va a entrar a la web.'}>
        {formulario && <FormEmpleado key={formulario.id || 'nuevo'} inicial={formulario.id ? formulario : null} zonas={listaZonas} usuarios={todos}
                                     error={error} guardando={ocupado} onGuardar={guardar} onCancelar={() => setFormulario(null)} />}
        {/* Las fotos de rostro se cargan después de crear al empleado, y solo si sigue activo */}
        {formulario?.id && formulario.activo && (
          <section className="mt-8 border-t border-zinc-200/80 pt-6 dark:border-zinc-800">
            <h3 className="mb-1 font-semibold">Fotos de rostro</h3>
            <FotosRostro usuarioId={formulario.id} />
          </section>
        )}
      </PanelLateral>

      <Confirmar abierto={Boolean(aBaja)} titulo={`Dar de baja a ${aBaja?.nombre || ''}`} accion="Sí, dar de baja" ocupado={ocupado} error={error}
                 onConfirmar={darDeBaja} onCancelar={() => setABaja(null)}>
        <p>Ya no va a poder entrar a la web.</p>
        <p>Su historial de alertas se conserva y lo podés reactivar cuando quieras.</p>
        <p>Sus fotos de rostro se borran.</p>
      </Confirmar>
    </>
  )
}
