// Tarjeta para activar las notificaciones push en este celular o PC.
// Está en el Perfil del empleado y en el Panel del encargado.
import { useAvisos } from '../context/AvisosContext.jsx'
import useNotificaciones from '../hooks/useNotificaciones.js'
import { botonFantasma, botonPrimario, botonSecundario, mensajeError, tarjeta, textoSuave } from '../utils/estilos.js'
import Etiqueta from './Etiqueta.jsx'
import Icono from './Icono.jsx'

const ESTADOS = {
  cargando: { tono: 'neutro', etiqueta: 'Revisando…', texto: 'Revisando si este navegador permite notificaciones.' },
  'no-soportado': { tono: 'neutro', etiqueta: 'No disponibles',
    texto: 'Este navegador no permite notificaciones acá. Funcionan en la versión online (https). En iPhone, primero instalá la app: Compartir → Agregar a inicio.' },
  'solo-compilada': { tono: 'neutro', etiqueta: 'No disponibles',
    texto: 'Funcionan en la versión compilada de la web (npm run build y npm run preview) o en la versión online.' },
  bloqueadas: { tono: 'alerta', etiqueta: 'Bloqueadas',
    texto: 'Bloqueaste las notificaciones para esta web. Habilitalas desde el candado de la barra de direcciones y recargá la página.' },
  apagadas: { tono: 'neutro', etiqueta: 'Apagadas', texto: 'Activalas para enterarte de cada alerta aunque tengas la web cerrada.' },
  activadas: { tono: 'ok', etiqueta: 'Activadas', texto: 'Este dispositivo recibe una notificación con cada alerta nueva.' },
}

export default function Notificaciones() {
  const { estado, ocupado, error, activar, desactivar, probar } = useNotificaciones()
  const avisar = useAvisos()
  const info = ESTADOS[estado]

  const enviarPrueba = async () => {
    if (await probar()) avisar('Notificación de prueba enviada')
  }

  return (
    <section className={tarjeta} aria-labelledby="titulo-notificaciones">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-notificaciones" className="flex items-center gap-2 font-semibold">
          <Icono nombre="campana" className="size-5 text-zinc-500" /> Notificaciones
        </h2>
        <Etiqueta tono={info.tono} punto={estado === 'activadas'}>{info.etiqueta}</Etiqueta>
      </div>
      <p className={`mt-2 text-sm ${textoSuave}`}>{info.texto}</p>
      {error && <p className={`mt-3 ${mensajeError}`}>{error}</p>}

      {estado === 'apagadas' && (
        <button type="button" className={`${botonPrimario} mt-4`} onClick={activar} disabled={ocupado}>
          {ocupado ? 'Activando…' : 'Activar notificaciones'}
        </button>
      )}
      {estado === 'activadas' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={botonSecundario} onClick={enviarPrueba} disabled={ocupado}>Enviar una de prueba</button>
          <button type="button" className={botonFantasma} onClick={desactivar} disabled={ocupado}>Desactivar</button>
        </div>
      )}
    </section>
  )
}
