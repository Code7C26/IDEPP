// Marco de la página pública de DROID-E3D (sin login): encabezado, contenido de cada página y pie.
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../Logo.jsx'
import EncabezadoPublico, { SECCIONES } from './EncabezadoPublico.jsx'

function Pie() {
  return (
    <footer className="relative border-t-4 border-marca bg-tinta text-zinc-100 dark:bg-zinc-950">
      <span aria-hidden="true" className="rayas-marca-grande absolute top-8 right-6 hidden opacity-90 md:block" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <Logo className="size-9" />
          <p className="mt-3 max-w-xs text-sm text-zinc-400">
            Seguridad que recorre la planta. Un producto de IDEPP.
          </p>
        </div>
        <div>
          <p className="font-titulo text-sm font-extrabold text-marca">Producto</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {SECCIONES.map((s) => <li key={s.ruta}><Link to={s.ruta} className="hover:text-white">{s.texto}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-titulo text-sm font-extrabold text-marca">Clientes</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li><Link to="/login" className="hover:text-white">Ingresar a la app</Link></li>
            <li><Link to="/contacto" className="hover:text-white">Pedir una demo</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} IDEPP · DROID-E3D by IDEPP
      </p>
    </footer>
  )
}

export default function LayoutPublico() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])   // cada página nueva arranca desde arriba

  return (
    <div className="flex min-h-dvh flex-col bg-crema text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-marca focus:px-3 focus:py-2 focus:text-tinta">
        Saltar al contenido
      </a>
      <EncabezadoPublico />
      <main id="contenido" className="flex-1"><Outlet /></main>
      <Pie />
    </div>
  )
}
