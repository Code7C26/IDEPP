// Globito con la cantidad de comentarios de una alerta. Si no tiene comentarios, no se muestra.
import Icono from './Icono.jsx'

export default function ContadorComentarios({ cantidad }) {
  if (!cantidad) return null
  const texto = `${cantidad} ${cantidad === 1 ? 'comentario' : 'comentarios'}`
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400" title={texto}>
      <Icono nombre="chat" className="size-3.5" />
      <span className="tabular-nums" aria-hidden="true">{cantidad}</span>
      <span className="sr-only">{texto}</span>
    </span>
  )
}
