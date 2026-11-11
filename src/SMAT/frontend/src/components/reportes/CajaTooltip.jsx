// Recuadro que aparece al pasar el mouse (o tocar) una barra de un gráfico.
export default function CajaTooltip({ titulo, children }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 font-semibold text-zinc-900 first-letter:uppercase dark:text-white">{titulo}</p>
      {children}
    </div>
  )
}
