// Piezas que se repiten en la página pública: sección con título, tarjeta con ícono,
// encabezado de página y la franja final de "Pedí una demo".
import { Link } from 'react-router-dom'
import Icono from '../Icono.jsx'

export const botonOscuro = 'inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
export const botonClaro = 'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'

// Texto chico arriba de un título (ej. "CÓMO FUNCIONA")
export function Antetitulo({ children }) {
  return <p className="text-xs font-bold tracking-[0.18em] text-marca-oscuro uppercase dark:text-marca">{children}</p>
}

// Primer bloque de cada página interna (Planes, Nosotros...)
export function EncabezadoPagina({ antetitulo, titulo, children }) {
  return (
    <section className="border-b border-zinc-200/70 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <Antetitulo>{antetitulo}</Antetitulo>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-5xl">{titulo}</h1>
        {children && <p className="mt-4 max-w-2xl text-lg text-zinc-600 text-pretty dark:text-zinc-300">{children}</p>}
      </div>
    </section>
  )
}

export function Seccion({ antetitulo, titulo, descripcion, children, gris = false }) {
  return (
    <section className={gris ? 'bg-zinc-50 dark:bg-zinc-900/40' : ''}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        {antetitulo && <Antetitulo>{antetitulo}</Antetitulo>}
        {titulo && <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-balance">{titulo}</h2>}
        {descripcion && <p className="mt-3 max-w-2xl text-zinc-600 text-pretty dark:text-zinc-300">{descripcion}</p>}
        <div className={titulo || descripcion ? 'mt-10' : ''}>{children}</div>
      </div>
    </section>
  )
}

export function Caracteristica({ icono, titulo, children }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <span className="grid size-11 place-items-center rounded-xl bg-marca/15 text-marca-oscuro dark:text-marca"><Icono nombre={icono} /></span>
      <h3 className="mt-4 font-semibold">{titulo}</h3>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
    </div>
  )
}

// Franja oscura del final: invita a pedir una demo
export function LlamadoDemo() {
  return (
    <section className="px-4 pb-16 md:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-tinta px-6 py-12 text-white md:px-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(45deg,#f5b800_0_12px,#1f2328_12px_24px)]" />
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">¿Querés verlo funcionando en tu planta?</h2>
            <p className="mt-2 max-w-xl text-zinc-300">Te mostramos el robot, la alerta con foto y la parada de máquina en una demo de 20 minutos.</p>
          </div>
          <Link to="/contacto" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-marca px-5 py-3 text-sm font-bold text-tinta hover:bg-marca-oscuro">
            Pedir una demo <Icono nombre="flecha" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
