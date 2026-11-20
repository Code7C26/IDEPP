// Botón para cambiar el idioma (español / inglés). Muestra "ES · EN" con el idioma activo resaltado.
import { useIdioma } from '../context/IdiomaContext.jsx'

export default function BotonIdioma({ className = '' }) {
  const { idioma, cambiarIdioma } = useIdioma()
  const opcion = (codigo) =>
    `rounded px-1 ${idioma === codigo ? 'bg-marca text-tinta' : 'text-zinc-500 dark:text-zinc-400'}`

  return (
    <button type="button" onClick={cambiarIdioma} data-guia="idioma"
            aria-label={idioma === 'es' ? 'Cambiar idioma a inglés' : 'Change language to Spanish'}
            title={idioma === 'es' ? 'English' : 'Español'}
            className={`inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg px-1.5 text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}>
      <span className={opcion('es')}>ES</span>
      <span className={opcion('en')}>EN</span>
    </button>
  )
}
