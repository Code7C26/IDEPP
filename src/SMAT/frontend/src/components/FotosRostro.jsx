// Fotos de la cara de un empleado, que usa la IA para reconocerlo.
// Son datos personales (Ley 25.326): para subir una foto hay que marcar el consentimiento,
// y cualquier foto se puede borrar en el momento.
// Props: usuarioId · propias = true cuando la persona mira sus propias fotos (cambian los textos)
import { useRef, useState } from 'react'
import { deleteRostro, getRostros, uploadRostro } from '../api/client.js'
import { useAvisos } from '../context/AvisosContext.jsx'
import usePolling from '../hooks/usePolling.js'
import { botonPrimario, mensajeError } from '../utils/estilos.js'
import ImagenProtegida from './ImagenProtegida.jsx'

const MAX_MB = 5

function Foto({ foto, onBorrar }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <li className="relative">
      <ImagenProtegida ruta={foto.url} alt="Foto de rostro" className="aspect-square w-full rounded-lg" />
      <button type="button" onClick={() => (confirmando ? onBorrar(foto) : setConfirmando(true))} onBlur={() => setConfirmando(false)}
              className={`absolute inset-x-1 bottom-1 rounded-md px-1 py-1 text-xs font-medium shadow-sm ${confirmando ? 'bg-alerta text-white' : 'bg-white/90 text-zinc-700 hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-200'}`}>
        {confirmando ? 'Tocá para borrar' : 'Borrar'}
      </button>
    </li>
  )
}

export default function FotosRostro({ usuarioId, propias = false }) {
  const avisar = useAvisos()
  const fotos = usePolling(() => getRostros(usuarioId), 0, [usuarioId])
  const [archivo, setArchivo] = useState(null)
  const [consiento, setConsiento] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const entrada = useRef(null)
  const lista = fotos.datos?.fotos || []
  const maximo = fotos.datos?.maximo || 5

  // Se revisa antes de enviar para avisar enseguida (el servidor igual lo vuelve a controlar)
  const elegir = (e) => {
    const elegido = e.target.files[0] || null
    setError('')
    if (elegido && !['image/jpeg', 'image/png'].includes(elegido.type)) setError('La foto debe ser JPG o PNG.')
    else if (elegido && elegido.size > MAX_MB * 1024 * 1024) setError(`La foto supera los ${MAX_MB} MB.`)
    setArchivo(elegido)
  }

  const subir = async (e) => {
    e.preventDefault()
    setOcupado(true); setError('')
    try {
      await uploadRostro(usuarioId, archivo)
      setArchivo(null); setConsiento(false); entrada.current.value = ''
      fotos.recargar(); avisar('Foto guardada')
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const borrar = async (foto) => {
    try { await deleteRostro(usuarioId, foto.id); fotos.recargar(); avisar('Foto borrada') }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {propias ? 'La IA usa estas fotos para reconocerte. Podés borrarlas cuando quieras.' : 'La IA usa estas fotos para reconocer al empleado.'}
        {' '}Hasta {maximo} fotos, de frente y con buena luz.
      </p>

      {fotos.cargando && <p className="mt-3 text-sm text-zinc-500">Cargando…</p>}
      {!fotos.cargando && lista.length === 0 && <p className="mt-3 text-sm text-zinc-500">Todavía no hay fotos.</p>}
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Fotos de rostro">
        {lista.map((f) => <Foto key={f.id} foto={f} onBorrar={borrar} />)}
      </ul>

      {lista.length < maximo && (
        <form onSubmit={subir} className="mt-4 space-y-3 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          {/* El input del navegador queda oculto (en el celular cortaba su texto): se usa un botón propio.
              Como está dentro de la etiqueta, tocar el botón abre igual el selector de archivos. */}
          <label className="block text-sm font-medium">
            Nueva foto
            <input ref={entrada} type="file" accept="image/jpeg,image/png" onChange={elegir} className="peer sr-only" />
            <span className="mt-1 flex items-center gap-3 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-marca">
              <span className="shrink-0 cursor-pointer rounded-lg bg-zinc-100 px-3 py-2 font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                Elegir foto
              </span>
              <span className="min-w-0 truncate font-normal text-zinc-500 dark:text-zinc-400">
                {archivo ? archivo.name : 'Ninguna foto elegida'}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consiento} onChange={(e) => setConsiento(e.target.checked)} className="mt-0.5 size-4 accent-marca" />
            <span>
              {propias
                ? 'Doy mi consentimiento para que DROID-E3D use esta foto solo para reconocerme en la fábrica (Ley 25.326).'
                : 'El empleado dio su consentimiento por escrito para usar su foto solo para reconocerlo en la fábrica (Ley 25.326).'}
            </span>
          </label>
          {error && <p role="alert" className={mensajeError}>{error}</p>}
          <button type="submit" className={botonPrimario} disabled={!archivo || !consiento || Boolean(error) || ocupado}>
            {ocupado ? 'Subiendo…' : 'Subir foto'}
          </button>
        </form>
      )}
      {lista.length >= maximo && error && <p role="alert" className={`mt-3 ${mensajeError}`}>{error}</p>}
    </div>
  )
}
