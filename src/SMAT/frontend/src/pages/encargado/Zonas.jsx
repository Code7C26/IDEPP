// Gestión de zonas: su máquina, el EPP obligatorio y su lugar en el mapa de la fábrica.
import { useState } from 'react'
import { createZone, deleteZone, getIncidents, getZones, reactivateMachine, stopMachine, updateZone } from '../../api/client.js'
import Confirmar from '../../components/Confirmar.jsx'
import FormZona from '../../components/FormZona.jsx'
import MapaFabrica from '../../components/MapaFabrica.jsx'
import PanelLateral from '../../components/PanelLateral.jsx'
import TarjetaZona from '../../components/TarjetaZona.jsx'
import Titulo from '../../components/Titulo.jsx'
import { useAvisos } from '../../context/AvisosContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { botonPrimario, mensajeError, tarjeta } from '../../utils/estilos.js'

export default function Zonas() {
  const avisar = useAvisos()
  const zonas = usePolling(() => getZones(), 10000)
  const [formulario, setFormulario] = useState(null)   // null = cerrado · {} = nueva · zona = editar
  const [aBorrar, setABorrar] = useState(null)
  const [maquina, setMaquina] = useState(null)         // { zona, accion: 'reactivar' | 'detener', alertas }
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const lista = zonas.datos?.zonas || []

  // Corre una acción del servidor; si sale bien avisa y cierra todo, si no deja el error en la ventana
  const ejecutar = async (accion, exito) => {
    setOcupado(true); setError('')
    try {
      await accion()
      zonas.recargar(); avisar(exito)
      setFormulario(null); setABorrar(null); setMaquina(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }
  const abrirFormulario = (zona) => { setError(''); setFormulario(zona) }

  // Antes de reactivar una máquina se cuenta cuántas alertas siguen sin resolver en la zona
  const abrirMaquina = async (zona, accion) => {
    setError(''); setMaquina({ zona, accion, alertas: null })
    if (accion === 'reactivar') {
      try { setMaquina({ zona, accion, alertas: (await getIncidents({ zona_id: zona.id, estado: 'activa', limit: 1 })).total }) }
      catch (e) { setError(e.message) }
    }
  }
  const reactivando = maquina?.accion === 'reactivar'

  return (
    <>
      <Titulo titulo="Zonas" subtitulo={zonas.cargando && !zonas.datos ? 'Cargando…' : `${lista.length} zonas en la fábrica`}>
        <button type="button" className={botonPrimario} onClick={() => abrirFormulario({})}>+ Nueva zona</button>
      </Titulo>
      {zonas.error && <p role="alert" className={`mb-4 ${mensajeError}`}>{zonas.error}</p>}

      {lista.length > 0 && (
        <section className={`${tarjeta} mb-6`}>
          <MapaFabrica zonas={lista} onSeleccionar={abrirFormulario} />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Tocá una zona del mapa para editarla.</p>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {lista.map((z) => (
          <TarjetaZona key={z.id} zona={z} onEditar={abrirFormulario} onMaquina={abrirMaquina}
                       onBorrar={(zona) => { setError(''); setABorrar(zona) }} />
        ))}
      </div>

      <PanelLateral abierto={Boolean(formulario)} ancho="lg" onCerrar={() => setFormulario(null)}
                    titulo={formulario?.id ? `Editar ${formulario.nombre}` : 'Nueva zona'}
                    descripcion="Máquina, equipo de protección obligatorio y lugar en el mapa.">
        {formulario && (
          <FormZona key={formulario.id || 'nueva'} inicial={formulario} zonas={lista} error={error} guardando={ocupado}
                    onCancelar={() => setFormulario(null)}
                    onGuardar={(datos) => ejecutar(() => (formulario.id ? updateZone(formulario.id, datos) : createZone(datos)), formulario.id ? 'Zona guardada' : 'Zona creada')} />
        )}
      </PanelLateral>

      <Confirmar abierto={Boolean(maquina)} tono={reactivando ? 'aviso' : 'peligro'} ocupado={ocupado || (reactivando && maquina?.alertas === null && !error)} error={error}
                 titulo={`${reactivando ? 'Reactivar' : 'Detener'} ${maquina?.zona.maquina || ''}`} accion={reactivando ? 'Sí, reactivar' : 'Sí, detener'}
                 onCancelar={() => setMaquina(null)}
                 onConfirmar={() => ejecutar(() => (reactivando ? reactivateMachine : stopMachine)(maquina.zona.id),
                   `${maquina.zona.maquina} ${reactivando ? 'reactivada' : 'detenida'}`)}>
        {reactivando
          ? <>
              <p>La máquina de <strong>{maquina?.zona.nombre}</strong> vuelve a funcionar.</p>
              {maquina?.alertas > 0 && (
                <p className="rounded-lg bg-naranja/10 px-3 py-2 text-orange-800 dark:text-orange-300">
                  Hay {maquina.alertas} alerta{maquina.alertas > 1 ? 's' : ''} activa{maquina.alertas > 1 ? 's' : ''} sin resolver en esta zona. Confirmá que ya se corrigió el uso del equipo.
                </p>
              )}
            </>
          : <p>La máquina de <strong>{maquina?.zona.nombre}</strong> se corta hasta que la reactives.</p>}
      </Confirmar>

      <Confirmar abierto={Boolean(aBorrar)} titulo={`Borrar ${aBorrar?.nombre || ''}`} accion="Sí, borrar" ocupado={ocupado} error={error}
                 onCancelar={() => setABorrar(null)} onConfirmar={() => ejecutar(() => deleteZone(aBorrar.id), `${aBorrar.nombre} fue borrada`)}>
        <p>Se borra la zona y su lugar en el mapa.</p>
        <p>Solo se puede si no tiene empleados ni alertas registradas.</p>
      </Confirmar>
    </>
  )
}
