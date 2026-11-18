// Asistente de preguntas frecuentes de la página pública (el "chatbot" de la Etapa 5).
// Un botón abajo a la derecha abre una ventanita: se toca una pregunta o se escribe una, y responde con las
// respuestas fijas de utils/preguntas.js. No usa inteligencia artificial ni internet: responde lo mismo siempre.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIdioma } from '../../context/IdiomaContext.jsx'
import { PREGUNTAS, buscarRespuesta } from '../../utils/preguntas.js'
import Icono from '../Icono.jsx'

export default function Asistente() {
  const { idioma, t } = useIdioma()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])   // [{ de: 'persona' | 'asistente', texto, enlace? }]
  const [escrito, setEscrito] = useState('')
  const final = useRef(null)

  // Siempre muestra el último mensaje
  useEffect(() => { final.current?.scrollIntoView({ block: 'end' }) }, [mensajes, abierto])

  // Esc cierra la ventana
  useEffect(() => {
    if (!abierto) return undefined
    const tecla = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [abierto])

  const responder = (pregunta, textoPersona) => {
    const respuesta = pregunta
      ? { de: 'asistente', texto: pregunta.respuesta[idioma], enlace: pregunta.enlace }
      : { de: 'asistente', texto: t('No tengo esa respuesta. Elegí una de las preguntas o escribinos desde Contacto.'),
          enlace: { ruta: '/contacto', texto: { es: 'Ir a Contacto', en: 'Go to Contact' } } }
    setMensajes((m) => [...m, { de: 'persona', texto: textoPersona }, respuesta])
  }

  const enviar = (e) => {
    e.preventDefault()
    const texto = escrito.trim()
    if (!texto) return
    responder(buscarRespuesta(texto), texto)
    setEscrito('')
  }

  return (
    <>
      {abierto && (
        <section role="dialog" aria-label={t('Preguntas frecuentes')}
                 className="animar-aviso fixed right-4 bottom-20 z-40 flex max-h-[min(560px,calc(100dvh-7rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex items-center justify-between gap-2 bg-tinta px-4 py-3 text-white">
            <p className="font-titulo text-sm font-extrabold">{t('Preguntas frecuentes')}</p>
            <button type="button" onClick={() => setAbierto(false)} aria-label={t('Cerrar')}
                    className="grid size-8 place-items-center rounded-lg hover:bg-white/10"><Icono nombre="cerrar" className="size-4" /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
            <p className="rounded-xl rounded-tl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
              {t('¡Hola! Soy el asistente de DROID-E3D. ¿Qué querés saber?')}
            </p>
            {mensajes.map((m, i) => (
              <div key={i} className={m.de === 'persona'
                ? 'ml-8 rounded-xl rounded-tr-sm bg-marca/20 px-3 py-2 text-right'
                : 'mr-8 rounded-xl rounded-tl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800'}>
                {m.texto}
                {m.enlace && (
                  <Link to={m.enlace.ruta} onClick={() => setAbierto(false)}
                        className="mt-1.5 block font-semibold text-marca-oscuro hover:underline dark:text-marca">
                    {m.enlace.texto[idioma]} →
                  </Link>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PREGUNTAS.map((p) => (
                <button key={p.pregunta.es} type="button" onClick={() => responder(p, p.pregunta[idioma])}
                        className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium hover:border-marca hover:bg-marca/10 dark:border-zinc-700">
                  {p.pregunta[idioma]}
                </button>
              ))}
            </div>
            <div ref={final} />
          </div>

          <form onSubmit={enviar} className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
            <label htmlFor="pregunta-asistente" className="sr-only">{t('Escribí tu pregunta')}</label>
            <input id="pregunta-asistente" value={escrito} onChange={(e) => setEscrito(e.target.value)} maxLength={200}
                   placeholder={t('Escribí tu pregunta')}
                   className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca dark:border-zinc-700 dark:bg-zinc-950" />
            <button type="submit" className="rounded-lg bg-tinta px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
              {t('Enviar')}
            </button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}
              aria-label={abierto ? t('Cerrar las preguntas frecuentes') : t('Abrir las preguntas frecuentes')}
              className="fixed right-4 bottom-4 z-40 grid size-13 place-items-center rounded-full bg-marca text-tinta shadow-lg ring-4 ring-white transition hover:-translate-y-0.5 dark:ring-zinc-900">
        <Icono nombre={abierto ? 'cerrar' : 'chat'} className="size-6" />
      </button>
    </>
  )
}
