// Piezas que se repiten en la página pública: sección con título, tarjeta con ícono,
// encabezado de página y la franja final de "Pedí una demo".
import { Link } from 'react-router-dom'
import Icono from '../Icono.jsx'

export const botonOscuro = 'sombra-marca inline-flex items-center justify-center gap-2 rounded-xl bg-tinta px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900'
export const botonClaro = 'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'

// Texto chico arriba de un título (ej. "CÓMO FUNCIONA"), con las rayas /// de la caja
export function Antetitulo({ children }) {
  return (
    <p className="flex items-center gap-2.5 font-titulo text-xs font-extrabold tracking-[0.18em] text-marca-oscuro uppercase dark:text-marca">
      <span className="rayas-marca" aria-hidden="true" />{children}
    </p>
  )
}

// Primer bloque de cada página interna (Planes, Nosotros...)
export function EncabezadoPagina({ antetitulo, titulo, children }) {
  return (
    <section className="textura-rayas relative overflow-hidden border-b border-zinc-200/70 bg-crema-oscuro dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* franja oscura a la izquierda, como el costado de la caja */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-2 bg-tinta md:w-3" />
      <span aria-hidden="true" className="rayas-marca-grande absolute right-8 bottom-8 hidden opacity-90 md:block" />
      <div className="relative mx-auto max-w-6xl px-6 py-14 md:px-8 md:py-20">
        <Antetitulo>{antetitulo}</Antetitulo>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{titulo}</h1>
        <div className="trazo-marca mt-4" aria-hidden="true" />
        {children && <p className="mt-4 max-w-2xl text-lg text-zinc-600 text-pretty dark:text-zinc-300">{children}</p>}
      </div>
    </section>
  )
}

export function Seccion({ antetitulo, titulo, descripcion, children, gris = false }) {
  return (
    <section className={gris ? 'textura-rayas bg-crema-oscuro dark:bg-zinc-900/40' : ''}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        {antetitulo && <Antetitulo>{antetitulo}</Antetitulo>}
        {titulo && <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-balance">{titulo}</h2>}
        {titulo && <div className="trazo-marca mt-3" aria-hidden="true" />}
        {descripcion && <p className="mt-3 max-w-2xl text-zinc-600 text-pretty dark:text-zinc-300">{descripcion}</p>}
        <div className={titulo || descripcion ? 'mt-10' : ''}>{children}</div>
      </div>
    </section>
  )
}

export function Caracteristica({ icono, titulo, children }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* línea naranja que aparece arriba al pasar el mouse */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-marca transition-transform duration-300 group-hover:scale-x-100" />
      <span className="grid size-11 place-items-center rounded-xl bg-tinta text-marca shadow-[3px_3px_0_var(--color-marca)] dark:bg-zinc-800"><Icono nombre={icono} /></span>
      <h3 className="mt-5 font-bold">{titulo}</h3>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
    </div>
  )
}

// Franja oscura del final: invita a pedir una demo
export function LlamadoDemo() {
  return (
    <section className="px-4 pb-16 md:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-tinta px-6 py-12 text-white md:px-12 md:pr-72">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 franja-marca" />
        {/* el robot asomándose a la derecha, sobre un círculo naranja */}
        <div aria-hidden="true" className="absolute -right-10 -bottom-24 hidden size-80 rounded-full bg-marca/90 md:block" />
        <img src="/robot-droid.webp" alt="" aria-hidden="true" className="absolute right-6 -bottom-6 hidden w-56 md:block" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="rayas-marca mb-3" aria-hidden="true" />
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">¿Querés verlo funcionando en tu planta?</h2>
            <p className="mt-2 max-w-xl text-zinc-300">Te mostramos el robot, la alerta con foto y la alarma en una demo de 20 minutos.</p>
          </div>
          <Link to="/contacto" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-marca px-5 py-3 text-sm font-bold text-tinta shadow-[4px_4px_0_#fff] transition hover:-translate-y-0.5">
            Pedir una demo <Icono nombre="flecha" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
