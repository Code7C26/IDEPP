// Encabezado de cada página: título, subtítulo opcional y botones a la derecha (acciones).
export default function Titulo({ titulo, subtitulo, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <div className="trazo-marca mt-1.5" aria-hidden="true" />
        {subtitulo && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitulo}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}
