// Menú inferior para el celular (se oculta en pantallas medianas, donde está la BarraLateral).
// Si hay más de 4 opciones, muestra 3 y agrupa el resto en "Más".
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useIdioma } from '../context/IdiomaContext.jsx'
import { menuDe } from '../utils/menu.js'
import Icono from './Icono.jsx'

const claseItem = (activo) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
    activo ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
  }`

export default function BottomNav() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [masAbierto, setMasAbierto] = useState(false)
  const { t } = useIdioma()

  const items = menuDe(usuario)
  const visibles = items.length > 4 ? items.slice(0, 3) : items
  const extra = items.length > 4 ? items.slice(3) : []
  const extraActivo = extra.some((i) => pathname.startsWith(i.ruta))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
         aria-label={t('Menú principal')} data-guia="menu">
      {masAbierto && (
        <ul className="animar-aviso absolute inset-x-3 bottom-full mb-2 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {extra.map((item) => (
            <li key={item.ruta}>
              <NavLink to={item.ruta} onClick={() => setMasAbierto(false)}
                       className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Icono nombre={item.icono} /> {t(item.texto)}
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      <div className="flex">
        {visibles.map((item) => (
          <NavLink key={item.ruta} to={item.ruta} end={item.fin} onClick={() => setMasAbierto(false)}
                   className={({ isActive }) => claseItem(isActive)}>
            {({ isActive }) => (
              <>
                <span className={`rounded-full px-4 py-1 ${isActive ? 'bg-zinc-100 ring-1 ring-marca/60 dark:bg-zinc-800' : ''}`}>
                  <Icono nombre={item.icono} />
                </span>
                {t(item.texto)}
              </>
            )}
          </NavLink>
        ))}
        {extra.length > 0 && (
          <button type="button" onClick={() => setMasAbierto((v) => !v)} className={claseItem(extraActivo)}
                  aria-expanded={masAbierto}>
            <span className={`rounded-full px-4 py-1 ${extraActivo ? 'bg-zinc-100 ring-1 ring-marca/60 dark:bg-zinc-800' : ''}`}>
              <Icono nombre="mas" />
            </span>
            {t('Más')}
          </button>
        )}
      </div>
    </nav>
  )
}
