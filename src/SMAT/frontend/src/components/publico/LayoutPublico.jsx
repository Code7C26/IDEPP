// Marco de la página pública de SMAT (sin login): encabezado, contenido de cada página y pie.
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../Logo.jsx'
import EncabezadoPublico, { SECCIONES } from './EncabezadoPublico.jsx'

function Pie() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <Logo className="size-9" />
          <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Seguridad que recorre la planta. Un producto de SMAT, una división de TOUCH.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Producto</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            {SECCIONES.map((s) => <li key={s.ruta}><Link to={s.ruta} className="hover:text-zinc-900 dark:hover:text-white">{s.texto}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Clientes</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link to="/login" className="hover:text-zinc-900 dark:hover:text-white">Ingresar a la app</Link></li>
            <li><Link to="/contacto" className="hover:text-zinc-900 dark:hover:text-white">Pedir una demo</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-zinc-200/70 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        © {new Date().getFullYear()} SMAT · DROID-E3D by SMAT · una división de TOUCH
      </p>
    </footer>
  )
}

export default function LayoutPublico() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])   // cada página nueva arranca desde arriba

  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-marca focus:px-3 focus:py-2 focus:text-tinta">
        Saltar al contenido
      </a>
      <EncabezadoPublico />
      <main id="contenido" className="flex-1"><Outlet /></main>
      <Pie />
    </div>
  )
}
