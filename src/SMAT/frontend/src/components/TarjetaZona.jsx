// Tarjeta de una zona en la página Zonas: máquina o puesto, EPP obligatorio, lugar en el mapa y acciones.
import { botonPeligro, botonSecundario, tarjeta } from '../utils/estilos.js'
import { NOMBRES_EPP } from '../utils/formato.js'
import Etiqueta from './Etiqueta.jsx'

export default function TarjetaZona({ zona, onEditar, onBorrar }) {
  return (
    <article className={tarjeta}>
      <h2 className="text-base font-semibold">{zona.nombre}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{zona.maquina || 'Sin máquina o puesto cargado'}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Equipo de protección obligatorio">
        {zona.epp_requerido.length === 0 && <li className="text-sm text-zinc-500">Sin EPP configurado</li>}
        {zona.epp_requerido.map((e) => <li key={e}><Etiqueta tono="marca">{NOMBRES_EPP[e] || e}</Etiqueta></li>)}
      </ul>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Mapa: columna {zona.grilla_x + 1}, fila {zona.grilla_y + 1} · {zona.ancho}×{zona.alto} celdas</p>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button type="button" className={botonSecundario} onClick={() => onEditar(zona)}>Editar</button>
        <button type="button" className={botonPeligro} onClick={() => onBorrar(zona)}>Borrar</button>
      </div>
    </article>
  )
}
