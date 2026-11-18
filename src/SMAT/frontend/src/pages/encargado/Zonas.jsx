// Gestión de zonas: su máquina o puesto, el EPP obligatorio y su lugar en el mapa de la fábrica.
import { useState } from 'react'
import { createZone, deleteZone, getIncidents, getZones, updateZone } from '../../api/client.js'
import Confirmar from '../../components/Confirmar.jsx'
import FormZona from '../../components/FormZona.jsx'
import MapaFabrica from '../../components/MapaFabrica.jsx'
import PanelLateral from '../../components/PanelLateral.jsx'
import TarjetaZona from '../../components/TarjetaZona.jsx'
import Titulo from '../../components/Titulo.jsx'
import { useAvisos } from '../../context/AvisosContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { botonPrimario, mensajeError, tarjeta } from '../../utils/estilos.js'
import { contarPorZona } from '../../utils/mapa.js'

export default function Zonas() {
  const avisar = useAvisos()
  const zonas = usePolling(() => getZones(), 10000)
  const activas = usePolling(() => getIncidents({ estado: 'activa', limit: 200 }), 10000)
  const [formulario, setFormulario] = useState(null)   // null = cerrado · {} = nueva · zona = editar
  const [aBorrar, setABorrar] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const lista = zonas.datos?.zonas || []

  // Corre una acción del servidor; si sale bien avisa y cierra todo, si no deja el error en la ventana
  const ejecutar = async (accion, exito) => {
    setOcupado(true); setError('')
    try {
      await accion()
      zonas.recargar(); avisar(exito)
      setFormulario(null); setABorrar(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }
  const abrirFormulario = (zona) => { setError(''); setFormulario(zona) }

  return (
    <>
      <Titulo titulo="Zonas" subtitulo={zonas.cargando && !zonas.datos ? 'Cargando…' : `${lista.length} zonas en la fábrica`}>
        <button type="button" className={botonPrimario} onClick={() => abrirFormulario({})}>+ Nueva zona</button>
      </Titulo>
      {(zonas.error || activas.error) && <p role="alert" className={`mb-4 ${mensajeError}`}>{zonas.error || activas.error}</p>}

      {/* El mapa espera a las alertas: sin ellas pintaría todo en verde, como si estuviera en orden */}
      {lista.length > 0 && activas.datos && (
        <section className={`${tarjeta} mb-6`}>
          {/* Con un ancho máximo, para que en la PC las tarjetas de abajo no queden fuera de la pantalla */}
          <div className="mx-auto max-w-3xl">
            <MapaFabrica zonas={lista} alertasPorZona={contarPorZona(activas.datos.incidencias)} onSeleccionar={abrirFormulario} />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Tocá una zona del mapa para editarla.</p>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {lista.map((z) => (
          <TarjetaZona key={z.id} zona={z} onEditar={abrirFormulario}
                       onBorrar={(zona) => { setError(''); setABorrar(zona) }} />
        ))}
      </div>

      <PanelLateral abierto={Boolean(formulario)} ancho="lg" onCerrar={() => setFormulario(null)}
                    titulo={formulario?.id ? `Editar ${formulario.nombre}` : 'Nueva zona'}
                    descripcion="Máquina o puesto, equipo de protección obligatorio y lugar en el mapa.">
        {formulario && (
          <FormZona key={formulario.id || 'nueva'} inicial={formulario} zonas={lista} error={error} guardando={ocupado}
                    onCancelar={() => setFormulario(null)}
                    onGuardar={(datos) => ejecutar(() => (formulario.id ? updateZone(formulario.id, datos) : createZone(datos)), formulario.id ? 'Zona guardada' : 'Zona creada')} />
        )}
      </PanelLateral>

      <Confirmar abierto={Boolean(aBorrar)} titulo={`Borrar ${aBorrar?.nombre || ''}`} accion="Sí, borrar" ocupado={ocupado} error={error}
                 onCancelar={() => setABorrar(null)} onConfirmar={() => ejecutar(() => deleteZone(aBorrar.id), `${aBorrar.nombre} fue borrada`)}>
        <p>Se borra la zona y su lugar en el mapa.</p>
        <p>Solo se puede si no tiene empleados ni alertas registradas.</p>
      </Confirmar>
    </>
  )
}
