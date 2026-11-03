// Control del robot: video en vivo, vista 3D de dónde está, órdenes (iniciar, pausar, detener, EMERGENCIA) y ruta.
import { useState } from 'react'
import { getIncidents, getRobot, getRobotRoute, getZones, saveRobotRoute, saveRobotVideo, sendRobotCommand } from '../../api/client.js'
import ControlesRobot from '../../components/ControlesRobot.jsx'
import RutaRobot from '../../components/RutaRobot.jsx'
import Titulo from '../../components/Titulo.jsx'
import VideoEnVivo from '../../components/VideoEnVivo.jsx'
import VistaRobot3D from '../../components/VistaRobot3D.jsx'
import usePolling from '../../hooks/usePolling.js'
import { botonPrimario, campo, campoConError, mensajeError, tarjeta } from '../../utils/estilos.js'
import { contarPorZona } from '../../utils/mapa.js'

// ¿La dirección del video es válida? Devuelve el problema o '' (vacía = sin video, también vale)
function problemaEnUrl(url) {
  if (!url) return ''
  if (!/^https?:\/\//.test(url)) return 'Tiene que empezar con http:// o https://'
  try { new URL(url) } catch { return 'No es una dirección válida (revisá el puerto). Ej: http://192.168.0.20:8080/video' }
  return ''
}

// Dirección del video: la sirve la PC con la IA (la configura quien arma el robot)
function ConfigVideo({ actual, onGuardar }) {
  const [url, setUrl] = useState(actual)
  const [estado, setEstado] = useState({ error: '', ok: false })
  const problema = problemaEnUrl(url.trim())
  const guardar = async (e) => {
    e.preventDefault()
    if (problema) return
    try { await onGuardar(url.trim()); setEstado({ error: '', ok: true }) } catch (err) { setEstado({ error: err.message, ok: false }) }
  }
  return (
    <form onSubmit={guardar} className="mt-3">
      <label className="block text-sm font-medium">Dirección del video
        <div className="mt-1 flex gap-2">
          <input className={`${campo} ${problema ? campoConError : ''}`} aria-invalid={Boolean(problema)} value={url} onChange={(e) => { setUrl(e.target.value); setEstado({ error: '', ok: false }) }} placeholder="http://192.168.0.20:8080/video" />
          <button type="submit" className={botonPrimario} disabled={url.trim() === actual || Boolean(problema)}>Guardar</button>
        </div>
      </label>
      {problema && <p className={`mt-2 ${mensajeError}`}>{problema}</p>}
      {estado.error && <p role="alert" className={`mt-2 ${mensajeError}`}>{estado.error}</p>}
      {estado.ok && <p role="status" className="mt-2 text-sm text-ok">Dirección guardada.</p>}
    </form>
  )
}

export default function Robot() {
  const robot = usePolling(() => getRobot(), 2000)       // se actualiza cada 2 s para ver la respuesta del robot
  const ruta = usePolling(() => getRobotRoute(), 0)
  const zonas = usePolling(() => getZones(), 5000)        // cada tanto: las máquinas se detienen con las alertas
  const activas = usePolling(() => getIncidents({ estado: 'activa', limit: 200 }), 5000)
  const r = robot.datos

  const mandar = async (comando) => { await sendRobotCommand(comando); robot.recargar() }
  const guardarRuta = async (pasos) => { await saveRobotRoute(pasos); ruta.recargar() }
  const guardarVideo = async (url) => { await saveRobotVideo(url); robot.recargar() }

  return (
    <>
      <Titulo titulo="Robot" subtitulo="Control en vivo del DROID-E3D" />
      {robot.error && <p role="alert" className={`mb-4 ${mensajeError}`}>{robot.error}</p>}
      {robot.cargando && <p className="text-sm text-zinc-500">Cargando…</p>}

      {r && (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <section className={tarjeta}>
              <h2 className="mb-3 text-lg font-semibold">Cámara</h2>
              <VideoEnVivo url={r.url_video} />
              <ConfigVideo key={r.url_video} actual={r.url_video || ''} onGuardar={guardarVideo} />
            </section>
            <section className={tarjeta}>
              <h2 className="mb-3 text-lg font-semibold">Dónde está el robot</h2>
              <VistaRobot3D zonas={zonas.datos?.zonas} robot={r} ruta={(ruta.datos?.ruta || []).map((p) => p.zona_id)}
                            alertasPorZona={activas.datos ? contarPorZona(activas.datos.incidencias) : null} />
            </section>
          </div>
          <div className="space-y-6">
            <ControlesRobot robot={r} onComando={mandar} />
            {ruta.datos && zonas.datos && (
              <RutaRobot ruta={ruta.datos.ruta.map(({ zona_id, tiempo_espera_seg }) => ({ zona_id, tiempo_espera_seg }))}
                         zonas={zonas.datos.zonas} onGuardar={guardarRuta} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
