// Guía interactiva: un recorrido paso a paso que resalta partes de la página y explica para qué sirven
// (la misma idea que la librería Intro.js, pero hecha por nosotros para no sumar dependencias).
//  - <GuiaInteractiva /> va una sola vez en main.jsx y queda escuchando.
//  - <BotonGuia /> es el botón "?" que la abre. También se puede abrir con abrirGuia().
// Los pasos de cada página están en utils/guias.js.
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useIdioma } from '../context/IdiomaContext.jsx'
import { pasosDeGuia } from '../utils/guias.js'

const EVENTO = 'abrir-guia'
export const abrirGuia = () => window.dispatchEvent(new Event(EVENTO))

// Busca el primer elemento visible con data-guia="<objetivo>" (puede haber uno para PC y otro para celular)
function buscarObjetivo(objetivo) {
  const candidatos = document.querySelectorAll(`[data-guia="${objetivo}"]`)
  for (const el of candidatos) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

export default function GuiaInteractiva() {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const { idioma, t } = useIdioma()
  const [pasos, setPasos] = useState(null)   // null = guía cerrada
  const [numero, setNumero] = useState(0)
  const [caja, setCaja] = useState(null)     // posición del elemento resaltado (o null si va al centro)

  const cerrar = useCallback(() => setPasos(null), [])

  // Escucha el pedido de abrir la guía
  useEffect(() => {
    const abrir = () => { setPasos(pasosDeGuia(pathname, usuario)); setNumero(0) }
    window.addEventListener(EVENTO, abrir)
    return () => window.removeEventListener(EVENTO, abrir)
  }, [pathname, usuario])

  // Si cambiás de página, la guía se cierra
  useEffect(() => { setPasos(null) }, [pathname])

  // Ubica el elemento del paso actual y lo sigue si se mueve la pantalla
  useEffect(() => {
    if (!pasos) return undefined
    const el = buscarObjetivo(pasos[numero].objetivo)
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (el) el.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' })
    const medir = () => {
      const r = el?.getBoundingClientRect()
      setCaja(r ? { top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 } : null)
    }
    medir()
    const reloj = setTimeout(medir, 400)   // otra vez cuando termina el desplazamiento suave
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      clearTimeout(reloj)
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [pasos, numero])

  // Teclado: Esc cierra, flechas avanzan y retroceden
  useEffect(() => {
    if (!pasos) return undefined
    const tecla = (e) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === 'ArrowRight') setNumero((n) => Math.min(n + 1, pasos.length - 1))
      if (e.key === 'ArrowLeft') setNumero((n) => Math.max(n - 1, 0))
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [pasos, cerrar])

  if (!pasos) return null
  const paso = pasos[numero]
  const ultimo = numero === pasos.length - 1

  // El globo va debajo del elemento si hay lugar; si no, arriba; si el elemento es muy alto, abajo de todo.
  // Sin elemento, al centro.
  const ANCHO = 320
  const ALTO = 230   // alto aproximado del globo
  let estiloGlobo = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  if (caja) {
    const left = Math.max(12, Math.min(caja.left, window.innerWidth - ANCHO - 12))
    const abajo = caja.top + caja.height + 12
    if (abajo + ALTO < window.innerHeight) estiloGlobo = { left, top: abajo }
    else if (caja.top - 12 > ALTO) estiloGlobo = { left, bottom: window.innerHeight - caja.top + 12 }
    else estiloGlobo = { left, bottom: 12 }
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="guia-titulo">
      {/* Fondo oscuro: si hay elemento, se hace con la sombra gigante del recuadro, así el elemento queda "iluminado" */}
      {caja
        ? <div className="pointer-events-none fixed rounded-xl ring-2 ring-marca transition-all duration-300"
               style={{ ...caja, boxShadow: '0 0 0 9999px rgba(9, 9, 11, 0.6)' }} />
        : <div className="fixed inset-0 bg-zinc-950/60" />}
      <div className="fixed inset-0" onClick={cerrar} />

      <div className="animar-aviso fixed w-[min(320px,calc(100vw-24px))] rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
           style={estiloGlobo}>
        <p className="text-xs font-semibold text-marca-oscuro dark:text-marca">
          {t('Paso')} {numero + 1} {t('de')} {pasos.length}
        </p>
        <h2 id="guia-titulo" className="mt-1 text-lg font-bold">{paso.titulo[idioma]}</h2>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{paso.texto[idioma]}</p>

        {/* puntitos de avance */}
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {pasos.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= numero ? 'bg-marca' : 'bg-zinc-200 dark:bg-zinc-700'}`} />)}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={cerrar} className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">{t('Saltar')}</button>
          <div className="flex gap-2">
            {numero > 0 && (
              <button type="button" onClick={() => setNumero(numero - 1)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                {t('Anterior')}
              </button>
            )}
            <button type="button" autoFocus onClick={() => (ultimo ? cerrar() : setNumero(numero + 1))}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
              {ultimo ? t('Terminar') : t('Siguiente')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Botón "?" que abre la guía de la página actual
export function BotonGuia({ className = '' }) {
  const { t } = useIdioma()
  return (
    <button type="button" onClick={abrirGuia} aria-label={t('Abrir la guía')} title={t('Abrir la guía')}
            className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white ${className}`}>
      ?
    </button>
  )
}
