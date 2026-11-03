// Inicio del empleado: estado de su zona, EPP obligatorio, su cumplimiento y sus últimas alertas.
import { Link } from 'react-router-dom'
import { getIncidents, getMe } from '../../api/client.js'
import AlertCard from '../../components/AlertCard.jsx'
import Icono from '../../components/Icono.jsx'
import StatCard from '../../components/StatCard.jsx'
import Titulo from '../../components/Titulo.jsx'
import ZonaCard from '../../components/ZonaCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { calcularCumplimiento } from '../../utils/cumplimiento.js'
import { fechaHaceDias } from '../../utils/formato.js'

const DIAS = 30

// Cartel grande: rojo si hay alertas activas, verde si está todo en orden
function Estado({ activas }) {
  const hayAlertas = activas > 0
  return (
    <div className={`mb-5 flex items-center gap-3 rounded-xl p-4 text-white shadow ${hayAlertas ? 'bg-alerta' : 'bg-ok'}`}>
      <Icono nombre={hayAlertas ? 'alerta' : 'ok'} className="size-7 shrink-0" />
      <p className="font-semibold">
        {hayAlertas
          ? `Tenés ${activas} alerta${activas > 1 ? 's' : ''} activa${activas > 1 ? 's' : ''}. Revisá tu equipo de protección.`
          : 'Todo en orden: no tenés alertas activas.'}
      </p>
    </div>
  )
}

export default function Inicio() {
  const { usuario } = useAuth()
  const yo = usePolling(() => getMe(), 10000) // la zona y el estado de la máquina pueden cambiar
  const alertas = usePolling(() => getIncidents({ desde: fechaHaceDias(DIAS - 1), limit: 200 }), 8000)

  const lista = alertas.datos?.incidencias || []
  const activas = lista.filter((i) => i.estado === 'activa').length
  const cumplimiento = calcularCumplimiento(lista, DIAS)
  const error = yo.error || alertas.error

  return (
    <>
      <Titulo titulo={`Hola, ${usuario.nombre.split(' ')[0]}`} subtitulo="Así estás hoy" />
      {error && <p role="alert" className="mb-4 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{error}</p>}

      {!alertas.cargando && <Estado activas={activas} />}

      <div className="mb-5 grid grid-cols-3 gap-3">
        {/* sin ícono y compactas: en el celular son 3 tarjetas angostas y el título necesita el lugar */}
        <StatCard compacta titulo="Cumplimiento" valor={alertas.cargando ? '…' : `${cumplimiento.porcentaje}%`} detalle={`últimos ${DIAS} días`} />
        <StatCard compacta titulo="Racha" valor={alertas.cargando ? '…' : cumplimiento.racha} detalle="días sin alertas" />
        <StatCard compacta titulo="Activas" valor={alertas.cargando ? '…' : activas} detalle="sin resolver" />
      </div>

      <ZonaCard zona={yo.datos?.zona_detalle} />

      <div className="mt-6 mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Tus últimas alertas</h2>
        <Link to="/app/mis-alertas" className="text-sm font-medium text-marca-oscuro hover:underline dark:text-marca">Ver todas</Link>
      </div>
      {alertas.cargando && <p className="text-sm text-zinc-500">Cargando…</p>}
      {!alertas.cargando && lista.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm text-zinc-500 dark:bg-zinc-900">No tuviste alertas en los últimos {DIAS} días. ¡Bien!</p>
      )}
      <div className="space-y-2">
        {lista.slice(0, 5).map((inc) => <AlertCard key={inc.id} incidencia={inc} />)}
      </div>
    </>
  )
}
