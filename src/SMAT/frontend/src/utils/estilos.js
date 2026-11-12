// Clases de Tailwind que se repiten (campos, botones, tarjetas), para que toda la web se vea igual.
// Estilo SaaS: botón principal oscuro, el amarillo de la marca queda para acentos.

export const campo = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-4 focus:ring-marca/25 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:disabled:bg-zinc-800'
export const campoConError = '!border-alerta focus:!border-alerta focus:!ring-alerta/20' // el ! gana sobre el borde gris del campo

const boton = 'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50'
export const botonPrimario = `${boton} bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white`
export const botonSecundario = `${boton} border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800`
export const botonFantasma = `${boton} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white`
// Peligro suave (acciones en listas) y fuerte (confirmar algo que no se puede deshacer fácil)
export const botonPeligro = `${boton} border border-zinc-200 bg-white text-alerta shadow-xs hover:bg-alerta/5 dark:border-zinc-700 dark:bg-zinc-900`
export const botonPeligroFuerte = `${boton} bg-alerta text-white shadow-sm hover:bg-red-700`

export const tarjeta = 'rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
export const mensajeError = 'rounded-lg border border-alerta/20 bg-alerta/5 px-3 py-2 text-sm text-alerta'
export const textoSuave = 'text-zinc-500 dark:text-zinc-400'
