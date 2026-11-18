// Encabezado de la página pública: logo, secciones, idioma, guía, tema y "Ingresar".
// En celular las secciones van en un menú que se abre con el botón de las tres rayas.
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { inicioSegunRol, useAuth } from '../../context/AuthContext.jsx'
import { useIdioma } from '../../context/IdiomaContext.jsx'
import { useTema } from '../../context/TemaContext.jsx'
import BotonIdioma from '../BotonIdioma.jsx'
import { BotonGuia } from '../GuiaInteractiva.jsx'
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
  const { t } = useIdioma()
  const { pathname } = useLocation()
  useEffect(() => { setAbierto(false) }, [pathname])   // al cambiar de página se cierra el menú

  // Con sesión iniciada, el botón lleva directo a la app
  const ingresar = usuario
    ? <Link to={inicioSegunRol(usuario)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">{t('Ir a la app')}</Link>
    : <Link to="/login" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">{t('Ingresar')}</Link>

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-crema/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="h-1 franja-marca" />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8" aria-label="Principal">
        <Link to="/" aria-label={t('DROID-E3D, página de inicio')} data-guia="logo"><Logo className="size-9" /></Link>

        <div className="hidden items-center gap-1 md:flex" data-guia="secciones">
          {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta} className={enlace}>{t(s.texto)}</NavLink>)}
        </div>

        <div className="flex items-center gap-1">
          <BotonIdioma />
          <BotonGuia />
          <button type="button" onClick={cambiarTema} aria-label={oscuro ? t('Cambiar a tema claro') : t('Cambiar a tema oscuro')} data-guia="tema"
                  className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
            <Icono nombre={oscuro ? 'sol' : 'luna'} />
          </button>
          <span className="hidden sm:block" data-guia="ingresar">{ingresar}</span>
          <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="menu-publico"
                  aria-label={abierto ? t('Cerrar menú') : t('Abrir menú')} data-guia="secciones"
                  className="grid size-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800">
            <Icono nombre={abierto ? 'cerrar' : 'menu'} />
          </button>
        </div>
      </nav>

      {abierto && (
        <div id="menu-publico" className="animar-aviso border-t border-zinc-200/70 px-4 pt-2 pb-4 md:hidden dark:border-zinc-800">
          <div className="flex flex-col">
            {SECCIONES.map((s) => <NavLink key={s.ruta} to={s.ruta} className={(e) => `${enlace(e)} py-3 text-base`}>{t(s.texto)}</NavLink>)}
          </div>
          <div className="mt-2 sm:hidden [&>a]:block [&>a]:text-center">{ingresar}</div>
        </div>
      )}
    </header>
  )
}
