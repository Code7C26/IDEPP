// Botones para mandarle órdenes al robot y ver en qué estado está.
//  - robot: lo que devuelve GET /api/robot/estado
//  - onComando(comando): manda la orden (devuelve una promesa)
// Reglas (las mismas que valida el backend):
//  - después de una EMERGENCIA no se puede iniciar ni pausar; hay que tocar "Detener" para salir de ese estado
//  - sin conexión no se puede iniciar: el robot arrancaría solo cuando vuelva
import { useState } from 'react'
import { haceCuanto } from '../utils/formato.js'
import { botonSecundario, mensajeError, tarjeta } from '../utils/estilos.js'
import Icono from './Icono.jsx'

const ESTADOS = {
  recorriendo: { texto: 'Recorriendo', clase: 'bg-ok text-white' },
  pausado: { texto: 'Pausado', clase: 'bg-naranja text-white' },
  detenido: { texto: 'Detenido', clase: 'bg-zinc-500 text-white' },
  emergencia: { texto: 'EMERGENCIA', clase: 'bg-alerta text-white' },
}

export default function ControlesRobot({ robot, onComando }) {
  const [enviando, setEnviando] = useState('')
  const [error, setError] = useState('')
  const estado = ESTADOS[robot.estado] || ESTADOS.detenido
  const enEmergencia = robot.estado === 'emergencia'

  const enviar = async (comando) => {
    setError(''); setEnviando(comando)
    try { await onComando(comando) } catch (e) { setError(e.message) } finally { setEnviando('') }
  }
  const boton = (comando, texto, icono, deshabilitado) => (
    <button type="button" className={`${botonSecundario} flex-col gap-1 py-3 sm:flex-row`} disabled={deshabilitado || Boolean(enviando)} onClick={() => enviar(comando)}>
      <Icono nombre={icono} className="size-4" />{enviando === comando ? 'Enviando…' : texto}
    </button>
  )

  return (
    <section className={tarjeta}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Control del robot</h2>
        {/* Sin conexión no se muestra el estado: sería el último que reportó, no lo que pasa ahora */}
        {robot.conectado
          ? <span className={`rounded-full px-3 py-1 text-sm font-bold ${estado.clase}`}>{estado.texto}</span>
          : <span className="rounded-full bg-zinc-200 px-3 py-1 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Sin conexión</span>}
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span className={`size-2 rounded-full ${robot.conectado ? 'bg-ok' : 'bg-zinc-400'}`} />
        {robot.conectado ? 'Conectado' : robot.ultima_conexion ? `Último dato ${haceCuanto(robot.ultima_conexion)} (${estado.texto.toLowerCase()})` : 'Nunca se conectó'}
        {/* Sin conexión son datos viejos: se aclara para que no parezcan lo que pasa ahora */}
        {robot.conectado && ` · Batería ${robot.bateria}% · Zona: ${robot.zona_actual || 'sin datos'}`}
        {!robot.conectado && robot.ultima_conexion && ` · Última batería ${robot.bateria}% · Última zona: ${robot.zona_actual || 'sin datos'}`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {boton('iniciar', 'Iniciar', 'play', !robot.conectado || robot.estado === 'recorriendo' || enEmergencia)}
        {boton('pausar', 'Pausar', 'pausa', robot.estado !== 'recorriendo')}
        {boton('detener', 'Detener', 'stop', robot.estado === 'detenido' && !enEmergencia && !robot.comando_pendiente)}
      </div>

      {/* La emergencia va siempre habilitada y sin confirmación: cada segundo cuenta */}
      <button type="button" disabled={Boolean(enviando)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-alerta py-4 text-lg font-extrabold tracking-wide text-white shadow hover:bg-red-700 active:scale-[.99] disabled:opacity-60"
              onClick={() => enviar('emergencia')}>
        <Icono nombre="alerta" className="size-6" /> PARADA DE EMERGENCIA
      </button>

      {!robot.conectado && <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Para iniciarlo, el robot tiene que estar encendido y conectado. Sin conexión solo se pueden mandar órdenes de parada.</p>}
      {enEmergencia && <p className="mt-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">El robot está en emergencia. Para volver a usarlo, primero tocá <strong>Detener</strong>.</p>}
      {robot.comando_pendiente && (
        <p role="status" className="mt-3 rounded-lg bg-marca/15 px-3 py-2 text-sm">
          Orden enviada: <strong>{robot.comando_pendiente}</strong>. {robot.conectado
            ? 'Esperando que el robot la confirme…'
            : robot.comando_pendiente === 'iniciar'
              ? 'El robot se desconectó antes de tomarla: se va a cancelar y hay que iniciarlo de nuevo.'
              : 'El robot no está conectado: la recibirá cuando vuelva.'}
        </p>
      )}
      {!robot.conectado && robot.comando_pendiente === 'emergencia' && (
        <p role="alert" className={`mt-2 ${mensajeError}`}>Sin conexión no se puede garantizar la parada. Usá el botón físico de emergencia del robot.</p>
      )}
      {error && <p role="alert" className={`mt-3 ${mensajeError}`}>{error}</p>}
    </section>
  )
}
