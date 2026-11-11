// Contenido de la ventana con el detalle de una alerta (se muestra dentro de <Modal>): foto, datos y comentarios.
import { formatearFecha, nombreTipo, porcentaje } from '../utils/formato.js'
import Avatar from './Avatar.jsx'
import Comentarios from './Comentarios.jsx'
import Etiqueta, { tonoDeEstado } from './Etiqueta.jsx'
import ImagenProtegida from './ImagenProtegida.jsx'

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

export default function DetalleAlerta({ incidencia }) {
  return (
    <div className="space-y-4">
      {incidencia.imagen_url ? (
        <ImagenProtegida ruta={incidencia.imagen_url} alt={`Evidencia: ${nombreTipo(incidencia.tipo)}`}
                         className="aspect-video w-full rounded-lg border border-zinc-200 !object-contain bg-zinc-950 dark:border-zinc-700" />
      ) : (
        <div className="grid h-32 place-items-center rounded-lg bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
          Esta alerta no tiene foto
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4">
        <Dato etiqueta="Qué faltaba">{nombreTipo(incidencia.tipo)}</Dato>
        <Dato etiqueta="Estado">
          <Etiqueta tono={tonoDeEstado(incidencia.estado)} punto={incidencia.estado === 'activa'}>{incidencia.estado}</Etiqueta>
        </Dato>
        <Dato etiqueta="Zona">{incidencia.zona}</Dato>
        <Dato etiqueta="Detectado como"><span className="flex items-center gap-2"><Avatar nombre={incidencia.empleado_nombre} tamano="sm" />{incidencia.empleado_nombre}</span></Dato>
        <Dato etiqueta="Cuándo">{formatearFecha(incidencia.timestamp)}</Dato>
        <Dato etiqueta="Confianza de la IA">{porcentaje(incidencia.confianza)}</Dato>
        {incidencia.resuelta_at && <Dato etiqueta="Resuelta el">{formatearFecha(incidencia.resuelta_at)}</Dato>}
        {incidencia.resuelta_por_nombre && <Dato etiqueta="Resuelta por">{incidencia.resuelta_por_nombre}</Dato>}
      </dl>

      <Comentarios incidenciaId={incidencia.id} />
    </div>
  )
}
