// Conversación sobre una alerta, entre el encargado y el empleado detectado.
// Se actualiza sola cada 10 segundos mientras está abierta.
import { useState } from 'react'
import { comentar, getComentarios } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import usePolling from '../hooks/usePolling.js'
import { botonPrimario, campo, mensajeError, textoSuave } from '../utils/estilos.js'
import { haceCuanto } from '../utils/formato.js'
import Avatar from './Avatar.jsx'
import Etiqueta from './Etiqueta.jsx'

const MAXIMO = 500

export default function Comentarios({ incidenciaId }) {
  const { usuario } = useAuth()
  const lista = usePolling(() => getComentarios(incidenciaId), 10000, [incidenciaId])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const comentarios = lista.datos?.comentarios || []

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    setError('')
    try {
      await comentar(incidenciaId, texto)
      setTexto('')
      await lista.recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-comentarios" className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <h3 id="titulo-comentarios" className="mb-3 text-sm font-semibold">Comentarios{comentarios.length > 0 && ` (${comentarios.length})`}</h3>
      {lista.error && <p className={mensajeError}>{lista.error}</p>}
      {!lista.cargando && comentarios.length === 0 && (
        <p className={`text-sm ${textoSuave}`}>
          {usuario?.rol === 'encargado' ? 'Todavía no hay comentarios. Podés dejarle una nota al empleado.' : 'Todavía no hay comentarios. Podés contarle al encargado qué pasó.'}
        </p>
      )}
      <ol className="space-y-3">
        {comentarios.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <Avatar nombre={c.usuario_nombre} tamano="sm" />
            <div className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{c.usuario_id === usuario?.id ? 'Vos' : c.usuario_nombre}</span>
                {c.usuario_rol === 'encargado' && <Etiqueta tono="marca">Encargado</Etiqueta>}
                <span className={textoSuave}>{haceCuanto(c.created_at)}</span>
              </p>
              <p className="mt-1 text-sm break-words whitespace-pre-line">{c.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={enviar} className="mt-3">
        <label htmlFor="nuevo-comentario" className="sr-only">Escribir un comentario</label>
        <textarea id="nuevo-comentario" rows={2} maxLength={MAXIMO} className={`${campo} resize-none`} value={texto}
                  placeholder="Escribí un comentario…" onChange={(e) => setTexto(e.target.value)} />
        {error && <p className={`mt-2 ${mensajeError}`}>{error}</p>}
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={`text-xs tabular-nums ${textoSuave}`}>{texto.length}/{MAXIMO}</span>
          <button type="submit" className={botonPrimario} disabled={enviando || !texto.trim()}>{enviando ? 'Enviando…' : 'Comentar'}</button>
        </div>
      </form>
    </section>
  )
}
