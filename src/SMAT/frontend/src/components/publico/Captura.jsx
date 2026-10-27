// Captura real de la app dentro de un marco de navegador (PC) o de celular.
// Las imágenes están en public/capturas/<nombre>-claro.webp y <nombre>-oscuro.webp
// (se sacan con datos de prueba, nunca con fotos de personas reales) y se elige según el tema.
// width y height: el tamaño real de las imágenes. Con eso el navegador reserva el lugar antes de
// cargarlas (son "lazy") y la página no salta cuando aparecen.
export default function Captura({ nombre, alt, movil = false }) {
  const [ancho, alto] = movil ? [640, 1280] : [1600, 1000]
  const imagenes = (
    <>
      <img src={`/capturas/${nombre}-claro.webp`} alt={alt} width={ancho} height={alto} loading="lazy" className="block h-auto w-full dark:hidden" />
      <img src={`/capturas/${nombre}-oscuro.webp`} alt={alt} width={ancho} height={alto} loading="lazy" className="hidden h-auto w-full dark:block" />
    </>
  )

  if (movil) {
    return (
      <div className="mx-auto w-full max-w-[290px] rounded-[2.2rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl dark:border-zinc-700">
        <div className="overflow-hidden rounded-[1.6rem]">{imagenes}</div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800" aria-hidden="true">
        <span className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="ml-3 hidden rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-500 sm:block dark:bg-zinc-800">app.droide3d.com.ar</span>
      </div>
      {imagenes}
    </div>
  )
}
