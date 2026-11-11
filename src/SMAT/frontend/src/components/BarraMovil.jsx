// Barra superior para el celular (en PC está la BarraLateral): logo, sonido, tema y salir.
import { Link } from 'react-router-dom'
import { inicioSegunRol, useAuth } from '../context/AuthContext.jsx'
import { useSonido } from '../context/SonidoContext.jsx'
import { useTema } from '../context/TemaContext.jsx'
import Avatar from './Avatar.jsx'
import Icono from './Icono.jsx'
import Logo from './Logo.jsx'

const boton = 'grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'

export default function BarraMovil() {
  const { usuario, cerrarSesion } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const sonido = useSonido()

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="h-1 bg-[repeating-linear-gradient(45deg,#f5b800_0_10px,#1f2328_10px_20px)]" />
      <div className="flex h-14 items-center justify-between px-4">
        <Link to={inicioSegunRol(usuario)} aria-label="Ir al inicio"><Logo className="size-8" /></Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={sonido.alternar} className={boton} aria-pressed={sonido.activado} aria-label="Sonido de alertas">
            <Icono nombre={sonido.activado ? 'campana' : 'silencio'} />
          </button>
          <button type="button" onClick={cambiarTema} className={boton} aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
            <Icono nombre={oscuro ? 'sol' : 'luna'} />
          </button>
          <button type="button" onClick={cerrarSesion} className={boton} aria-label="Cerrar sesión"><Icono nombre="salir" /></button>
          <span className="ml-1" title={usuario?.nombre}><Avatar nombre={usuario?.nombre} tamano="sm" /></span>
        </div>
      </div>
    </header>
  )
}
