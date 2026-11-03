// Encabezado de la página pública: logo, secciones, tema y "Ingresar".
// En celular las secciones van en un menú que se abre con el botón de las tres rayas.
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { inicioSegunRol, useAuth } from '../../context/AuthContext.jsx'
import { useTema } from '../../context/TemaContext.jsx'
import Icono from '../Icono.jsx'
import Logo from '../Logo.jsx'

export const SECCIONES = [
  { ruta: '/como-funciona', texto: 'Cómo funciona' },
  { ruta: '/juego', texto: 'Juego' },
  { ruta: '/planes', texto: 'Planes' },
  { ruta: '/nosotros', texto: 'Nosotros' },
  { ruta: '/contacto', texto: 'Contacto' },
]

const enlace = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`

export default function EncabezadoPublico() {
  const { usuario } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setAbierto(false) }, [pathname])   // al cambiar de página se cierra el menú

  // Con sesión iniciada, el botón lleva directo a la app
  const ingresar = usuario
    ? <Link to={inicioSegunRol(usuario)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">Ir a la app</Link>
    : <Link to="/login" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">Ingresar</Link>

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="h-1 bg-[repeating-linear-gradient(45deg,#f5b800_0_10px,#1f2328_10px_20px)]" />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8" aria-label="Principal">
        <Link to="/" aria-label="DROID-E3D, página de inicio"><Logo className="size-9" /></Link>

        <div className="hidden items-center gap-1 md:flex">
          {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta} className={enlace}>{s.texto}</NavLink>)}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={cambiarTema} aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
            <Icono nombre={oscuro ? 'sol' : 'luna'} />
          </button>
          <span className="hidden sm:block">{ingresar}</span>
          <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="menu-publico"
                  aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
                  className="grid size-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800">
            <Icono nombre={abierto ? 'cerrar' : 'menu'} />
          </button>
        </div>
      </nav>

      {abierto && (
        <div id="menu-publico" className="animar-aviso border-t border-zinc-200/70 px-4 pt-2 pb-4 md:hidden dark:border-zinc-800">
          <div className="flex flex-col">
            {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta} className={(e) => `${enlace(e)} py-3 text-base`}>{s.texto}</NavLink>)}
          </div>
          <div className="mt-2 sm:hidden [&>a]:block [&>a]:text-center">{ingresar}</div>
        </div>
      )}
    </header>
  )
}
