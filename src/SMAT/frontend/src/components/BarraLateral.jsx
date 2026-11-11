// Barra lateral fija (PC y tablet), estilo SaaS: logo arriba, menú por secciones y el usuario abajo.
// Se puede colapsar a solo íconos; la elección se guarda en el navegador.
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { inicioSegunRol, useAuth } from '../context/AuthContext.jsx'
import { useSonido } from '../context/SonidoContext.jsx'
import { useTema } from '../context/TemaContext.jsx'
import { menuAgrupado } from '../utils/menu.js'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'
import Logo from './Logo.jsx'

const leerColapsado = () => { try { return localStorage.getItem('menu-colapsado') === '1' } catch { return false } }
const iconoChico = 'grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'

export default function BarraLateral() {
  const { usuario, cerrarSesion } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const sonido = useSonido()
  const [colapsado, setColapsado] = useState(leerColapsado)

  const alternar = () => {
    setColapsado(!colapsado)
    try { localStorage.setItem('menu-colapsado', colapsado ? '0' : '1') } catch { /* sin acceso: no se recuerda */ }
  }

  return (
    <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-zinc-200/80 bg-white transition-[width] duration-200 md:flex dark:border-zinc-800 dark:bg-zinc-900 ${colapsado ? 'w-[72px]' : 'w-64'}`}>
      <div className="h-1 shrink-0 bg-[repeating-linear-gradient(45deg,#f5b800_0_10px,#1f2328_10px_20px)]" />
      <div className={`flex h-16 items-center ${colapsado ? 'justify-center' : 'justify-between px-4'}`}>
        <Link to={inicioSegunRol(usuario)} aria-label="Ir al inicio"><Logo conTexto={!colapsado} className="size-8" /></Link>
        {!colapsado && <button type="button" onClick={alternar} className={iconoChico} aria-label="Achicar el menú" title="Achicar el menú"><span aria-hidden="true">«</span></button>}
      </div>
      {colapsado && <button type="button" onClick={alternar} className={`${iconoChico} mx-auto`} aria-label="Agrandar el menú" title="Agrandar el menú"><span aria-hidden="true">»</span></button>}

      <nav className="mt-2 flex-1 space-y-5 overflow-y-auto px-3" aria-label="Menú principal">
        {menuAgrupado(usuario).map(([grupo, items]) => (
          <div key={grupo}>
            {!colapsado && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{grupo}</p>}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.ruta}>
                  <NavLink to={item.ruta} end={item.fin} title={colapsado ? item.texto : undefined} aria-label={colapsado ? item.texto : undefined}
                           className={({ isActive }) => `relative flex items-center gap-3 rounded-lg py-2 text-sm transition ${colapsado ? 'justify-center' : 'px-3'} ${
                             isActive ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white'
                                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white'}`}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-marca" />}
                        <Icono nombre={item.icono} className="size-[18px]" />
                        {!colapsado && item.texto}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200/80 p-3 dark:border-zinc-800">
        <div className={`flex items-center gap-2 ${colapsado ? 'flex-col' : ''}`}>
          <Avatar nombre={usuario?.nombre} />
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{usuario?.nombre}</p>
              <p className="truncate text-xs text-zinc-500 capitalize dark:text-zinc-400">{usuario?.rol}{usuario?.zona ? ` · ${usuario.zona}` : ''}</p>
            </div>
          )}
        </div>
        {/* Sonido, tema y salir: en fila debajo del nombre (en columna si el menú está achicado) */}
        <div className={`mt-2 flex items-center gap-1 ${colapsado ? 'flex-col' : ''}`}>
          <button type="button" onClick={sonido.alternar} className={iconoChico} aria-pressed={sonido.activado}
                  aria-label="Sonido de alertas" title={sonido.activado ? 'Silenciar alertas' : 'Activar sonido de alertas'}>
            <Icono nombre={sonido.activado ? 'campana' : 'silencio'} className="size-4" />
          </button>
          <button type="button" onClick={cambiarTema} className={iconoChico} aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema">
            <Icono nombre={oscuro ? 'sol' : 'luna'} className="size-4" />
          </button>
          <button type="button" onClick={cerrarSesion} className={iconoChico} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icono nombre="salir" className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
