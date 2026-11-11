// Perfil del empleado: sus datos, su zona, sus fotos de rostro y las opciones que se suman en fases futuras.
import { getMe } from '../../api/client.js'
import FotosRostro from '../../components/FotosRostro.jsx'
import Icono from '../../components/Icono.jsx'
import Notificaciones from '../../components/Notificaciones.jsx'
import Titulo from '../../components/Titulo.jsx'
import ZonaCard from '../../components/ZonaCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTema } from '../../context/TemaContext.jsx'
import usePolling from '../../hooks/usePolling.js'

const tarjeta = 'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{etiqueta}</dt>
      <dd className="text-sm font-medium capitalize">{valor || '—'}</dd>
    </div>
  )
}

export default function Perfil() {
  const { cerrarSesion } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const { datos: yo, error, cargando } = usePolling(() => getMe(), 0) // una sola vez, no cambia seguido

  return (
    <>
      <Titulo titulo="Mi perfil" />
      {error && <p role="alert" className="mb-4 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{error}</p>}
      {cargando && <p className="text-sm text-zinc-500">Cargando…</p>}

      {yo && (
        <div className="space-y-4">
          <section className={tarjeta}>
            <div className="mb-2 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-marca text-lg font-bold text-tinta">
                {yo.nombre.charAt(0)}
              </span>
              <div>
                <h2 className="font-semibold">{yo.nombre}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">@{yo.usuario}</p>
              </div>
            </div>
            <dl>
              <Fila etiqueta="Legajo" valor={yo.legajo} />
              <Fila etiqueta="Rol" valor={yo.rol} />
              <Fila etiqueta="Zona" valor={yo.zona} />
            </dl>
          </section>

          <ZonaCard zona={yo.zona_detalle} />

          <section className={`${tarjeta} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-semibold">Tema de la pantalla</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Ahora: {oscuro ? 'oscuro' : 'claro'}</p>
            </div>
            <button type="button" onClick={cambiarTema}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              <Icono nombre={oscuro ? 'sol' : 'luna'} /> Cambiar
            </button>
          </section>

          <section className={tarjeta}>
            <h2 className="mb-1 font-semibold">Mis fotos de rostro</h2>
            <FotosRostro usuarioId={yo.id} propias />
          </section>
          <Notificaciones />

          <button type="button" onClick={cerrarSesion}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-alerta/40 py-2.5 font-medium text-alerta hover:bg-alerta/5">
            <Icono nombre="salir" /> Cerrar sesión
          </button>
        </div>
      )}
    </>
  )
}
