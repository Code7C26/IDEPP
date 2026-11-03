// Panel del encargado: números del día, mapa de la fábrica, estado del robot y últimas alertas.
// Todo se actualiza solo cada pocos segundos.
import { useState } from 'react'
import { getIncidents, getRobot, getRobotRoute, getStats, getZones, reactivateMachine, resolveIncident, stopMachine } from '../../api/client.js'
import AlertCard from '../../components/AlertCard.jsx'
import DetalleZona from '../../components/DetalleZona.jsx'
import MapaFabrica, { LeyendaMapa } from '../../components/MapaFabrica.jsx'
import Notificaciones from '../../components/Notificaciones.jsx'
import PanelLateral from '../../components/PanelLateral.jsx'
import StatCard from '../../components/StatCard.jsx'
import Tabla from '../../components/Tabla.jsx'
import TarjetaRobot from '../../components/TarjetaRobot.jsx'
import Titulo from '../../components/Titulo.jsx'
import { useAvisos } from '../../context/AvisosContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { mensajeError, tarjeta } from '../../utils/estilos.js'
import { haceCuanto } from '../../utils/formato.js'
import { contarPorZona } from '../../utils/mapa.js'
import { calcularTendencia } from '../../utils/tendencia.js'

export default function Panel() {
  const avisar = useAvisos()
  const [errorAccion, setErrorAccion] = useState('')
  const [zonaAbierta, setZonaAbierta] = useState(null)   // id de la zona del panel lateral
  const stats = usePolling(() => getStats(), 5000)
  const zonas = usePolling(() => getZones(), 15000)
  const robot = usePolling(() => getRobot(), 4000)
  const ruta = usePolling(() => getRobotRoute(), 30000)
  const activas = usePolling(() => getIncidents({ estado: 'activa', limit: 200 }), 5000)
  const recientes = usePolling(() => getIncidents({ limit: 6 }), 5000)

  const s = stats.datos
  const serie = (s?.serie_14_dias || []).map((d) => d.total)   // alertas por día, para los mini gráficos
  const listaActivas = activas.datos?.incidencias || []
  const alertasPorZona = contarPorZona(listaActivas)
  const zona = zonas.datos?.zonas.find((z) => z.id === zonaAbierta)   // siempre con los datos más nuevos
  const error = [stats, zonas, robot, activas, recientes].map((p) => p.error).find(Boolean) || errorAccion

  const resolver = async (id) => {
    setErrorAccion('')
    try {
      await resolveIncident(id)
      stats.recargar(); activas.recargar(); recientes.recargar()
      avisar('Alerta marcada como resuelta')
    } catch (e) {
      setErrorAccion(e.message)
    }
  }

  // Desde el panel lateral de la zona: detener o reactivar su máquina (los errores los muestra el panel)
  const cambiarMaquina = async (accion) => {
    await (accion === 'detener' ? stopMachine : reactivateMachine)(zona.id)
    zonas.recargar()
    avisar(`${zona.maquina} ${accion === 'detener' ? 'detenida' : 'reactivada'}`)
  }

  return (
    <>
      <Titulo titulo="Panel" subtitulo="Se actualiza solo cada pocos segundos" />
      {error && <p role="alert" className={`mb-4 ${mensajeError}`}>{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Alertas activas" valor={s?.incidencias_activas} icono="alerta" tono={s?.incidencias_activas ? 'alerta' : 'ok'}
                  detalle={s?.incidencias_activas ? `Sin resolver · la más vieja, ${haceCuanto(s.activa_mas_antigua)}` : 'Todo resuelto'} />
        <StatCard titulo="Hoy" valor={s?.incidencias_hoy} icono="reportes" tono="marca"
                  tendencia={s && calcularTendencia(s.incidencias_hoy, s.incidencias_ayer, 'ayer')}
                  serie={serie.slice(-7)} />
        <StatCard titulo="Últimos 7 días" valor={s?.incidencias_semana} icono="panel"
                  tendencia={s && calcularTendencia(s.incidencias_semana, s.incidencias_semana_anterior, 'la semana anterior')}
                  serie={serie} />
        <StatCard titulo="Empleados activos" valor={s?.empleados_activos} icono="empleados" tono="ok" detalle="En planta, con usuario activo" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className={tarjeta}>
          <h2 className="mb-3 text-lg font-semibold">Mapa de la fábrica</h2>
          {zonas.cargando && <p className="text-sm text-zinc-500">Cargando…</p>}
          {/* El mapa espera a las alertas: sin ellas pintaría todo en verde, como si estuviera en orden */}
          {zonas.datos && activas.datos && (
            <MapaFabrica zonas={zonas.datos.zonas} alertasPorZona={alertasPorZona} robot={robot.datos}
                         ruta={(ruta.datos?.ruta || []).map((p) => p.zona_id)} seleccionada={zonaAbierta}
                         onSeleccionar={(z) => setZonaAbierta(z.id)} />
          )}
          <LeyendaMapa conRecorrido />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tocá una zona para ver su detalle.</p>
        </section>

        <div className="space-y-6">
          <TarjetaRobot robot={robot.datos} />
          <section>
            <h2 className="text-lg font-semibold">Zonas con más alertas</h2>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Desde el inicio, activas y resueltas</p>
            <Tabla claveFila="zona" filas={s?.top_zonas || []}
                   columnas={[{ clave: 'zona', titulo: 'Zona' }, { clave: 'incidencias', titulo: 'Alertas', clase: 'text-right tabular-nums' }]} />
          </section>
          <Notificaciones />
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Últimas alertas</h2>
        {recientes.cargando && <p className="text-sm text-zinc-500">Cargando…</p>}
        <div className="grid gap-2 lg:grid-cols-2">
          {(recientes.datos?.incidencias || []).map((inc) => <AlertCard key={inc.id} incidencia={inc} onResolver={resolver} />)}
        </div>
      </section>

      <PanelLateral abierto={Boolean(zona)} titulo={zona?.nombre} onCerrar={() => setZonaAbierta(null)}
                    descripcion={zona && (alertasPorZona[zona.id] ? `${alertasPorZona[zona.id]} alerta(s) activa(s)` : 'Todo en orden')}>
        {zona && <DetalleZona key={zona.id} zona={zona} alertas={listaActivas.filter((i) => i.zona_id === zona.id)}
                              onResolver={resolver} onMaquina={cambiarMaquina} />}
      </PanelLateral>
    </>
  )
}
