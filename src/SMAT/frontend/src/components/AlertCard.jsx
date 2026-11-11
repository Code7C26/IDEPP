// Tarjeta de una alerta (incidencia).
//  - onResolver: muestra el botón "Resolver" (solo si la alerta está activa)
//  - onVer: muestra el botón "Detalle"
import { botonPrimario, botonSecundario } from '../utils/estilos.js'
import { formatearFecha, haceCuanto, nombreTipo, porcentaje } from '../utils/formato.js'
import Avatar from './Avatar.jsx'
import ContadorComentarios from './ContadorComentarios.jsx'
import Etiqueta, { tonoDeEstado } from './Etiqueta.jsx'
import ImagenProtegida from './ImagenProtegida.jsx'

const chico = '!px-2.5 !py-1 !text-xs'

export default function AlertCard({ incidencia, onResolver, onVer }) {
  const activa = incidencia.estado === 'activa'

  return (
    <article className={`flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${activa ? '' : 'opacity-80'}`}>
      {/* Con foto de evidencia se muestra la miniatura; sin foto, las iniciales del empleado */}
      {incidencia.imagen_url
        ? <ImagenProtegida ruta={incidencia.imagen_url} alt={`Evidencia: ${nombreTipo(incidencia.tipo)}`} className="size-12 shrink-0 rounded-lg" />
        : <Avatar nombre={incidencia.empleado_nombre} />}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-semibold">{nombreTipo(incidencia.tipo)}</strong>
          <Etiqueta tono={tonoDeEstado(incidencia.estado)} punto={activa}>{incidencia.estado}</Etiqueta>
          <ContadorComentarios cantidad={incidencia.cantidad_comentarios} />
        </div>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
          {incidencia.empleado_nombre} · {incidencia.zona}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400" title={formatearFecha(incidencia.timestamp)}>
          {haceCuanto(incidencia.timestamp)} · confianza {porcentaje(incidencia.confianza)}
        </p>
      </div>

      {(onVer || (onResolver && activa)) && (
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
          {onVer && <button type="button" className={`${botonSecundario} ${chico}`} onClick={() => onVer(incidencia)}>Detalle</button>}
          {onResolver && activa && (
            <button type="button" className={`${botonPrimario} ${chico}`} onClick={() => onResolver(incidencia.id)}>Resolver</button>
          )}
        </div>
      )}
    </article>
  )
}
