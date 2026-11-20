// Barra superior para el celular (en PC está la BarraLateral): logo, sonido, tema, idioma, guía y salir.
import { Link } from 'react-router-dom'
import { inicioSegunRol, useAuth } from '../context/AuthContext.jsx'
import { useIdioma } from '../context/IdiomaContext.jsx'
import { useSonido } from '../context/SonidoContext.jsx'
import { useTema } from '../context/TemaContext.jsx'
import Avatar from './Avatar.jsx'
import BotonIdioma from './BotonIdioma.jsx'
import { BotonGuia } from './GuiaInteractiva.jsx'
import Icono from './Icono.jsx'
import Logo from './Logo.jsx'

// size-8: con el idioma y la guía, a 360 px no entraban los botones y el logo se partía en dos renglones
const boton = 'grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'

export default function BarraMovil() {
  const { usuario, cerrarSesion } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const sonido = useSonido()
  const { t } = useIdioma()

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="h-1 franja-marca" />
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        {/* min-w-0 + overflow-hidden: si algo no entra (por ejemplo, mientras carga la tipografía), se recorta el logo y no la página */}
        <Link to={inicioSegunRol(usuario)} aria-label={t('Ir al inicio')} className="min-w-0 overflow-hidden"><Logo className="size-8" textoClase="max-[339px]:hidden" /></Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={sonido.alternar} className={boton} aria-pressed={sonido.activado} aria-label={t('Sonido de alertas')} data-guia="sonido">
            <Icono nombre={sonido.activado ? 'campana' : 'silencio'} />
          </button>
          <button type="button" onClick={cambiarTema} className={boton} aria-label={oscuro ? t('Cambiar a tema claro') : t('Cambiar a tema oscuro')} data-guia="tema">
            <Icono nombre={oscuro ? 'sol' : 'luna'} />
          </button>
          <BotonIdioma />
          <BotonGuia />
          <button type="button" onClick={cerrarSesion} className={boton} aria-label={t('Cerrar sesión')} data-guia="salir"><Icono nombre="salir" /></button>
          <span className="ml-1 hidden min-[400px]:inline" title={usuario?.nombre}><Avatar nombre={usuario?.nombre} tamano="sm" /></span>
        </div>
      </div>
    </header>
  )
}
