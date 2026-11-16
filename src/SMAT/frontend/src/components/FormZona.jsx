// Formulario para crear o editar una zona (se muestra dentro de un <PanelLateral>).
// Incluye una vista previa del mapa: se ve dónde queda la zona y si se superpone con otra.
//  - inicial: la zona a editar, o {} para una nueva
//  - zonas: todas las zonas existentes (para el mapa, las superposiciones y los nombres repetidos)
import { useState } from 'react'
import useValidacion from '../hooks/useValidacion.js'
import { botonPrimario, botonSecundario, campo, mensajeError } from '../utils/estilos.js'
import { NOMBRES_EPP } from '../utils/formato.js'
import { zonasQueChocan } from '../utils/mapa.js'
import Campo from './Campo.jsx'
import MapaFabrica from './MapaFabrica.jsx'

const NUMEROS = [
  { nombre: 'grilla_x', etiqueta: 'Columna', min: 0 }, { nombre: 'grilla_y', etiqueta: 'Fila', min: 0 },
  { nombre: 'ancho', etiqueta: 'Ancho', min: 1 }, { nombre: 'alto', etiqueta: 'Alto', min: 1 },
]
const entero = (valor, minimo) => Math.max(minimo, Number.parseInt(valor, 10) || minimo)

export default function FormZona({ inicial, zonas, error, guardando, onGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre || '', maquina: inicial.maquina || '', epp_requerido: inicial.epp_requerido || [],
    grilla_x: inicial.grilla_x ?? 0, grilla_y: inicial.grilla_y ?? 0, ancho: inicial.ancho ?? 3, alto: inicial.alto ?? 2,
  })

  // La zona tal como quedaría: se usa para el mapa de vista previa y para ver si choca
  const borrador = {
    id: inicial.id ?? -1, nombre: f.nombre.trim() || 'Zona nueva', maquina: f.maquina, maquina_activa: inicial.maquina_activa ?? true,
    epp_requerido: f.epp_requerido,
    grilla_x: entero(f.grilla_x, 0), grilla_y: entero(f.grilla_y, 0), ancho: entero(f.ancho, 1), alto: entero(f.alto, 1),
  }
  const choques = zonasQueChocan(zonas, borrador)
  const nombreRepetido = zonas.some((z) => z.id !== inicial.id && z.nombre.toLowerCase() === f.nombre.trim().toLowerCase())

  const errores = {
    nombre: !f.nombre.trim() ? 'Poné un nombre a la zona.' : nombreRepetido ? 'Ya hay una zona con ese nombre.' : '',
    lugar: choques.length ? `Se superpone con ${choques.map((z) => z.nombre).join(', ')}. Cambiá el lugar o el tamaño.` : '',
  }
  const { error: errorDe, tocar, puedeEnviar } = useValidacion(errores)

  const alternarEpp = (epp) => setF({
    ...f, epp_requerido: f.epp_requerido.includes(epp) ? f.epp_requerido.filter((e) => e !== epp) : [...f.epp_requerido, epp],
  })

  const enviar = (e) => {
    e.preventDefault()
    if (!puedeEnviar()) return
    onGuardar({
      nombre: f.nombre.trim(), maquina: f.maquina.trim(), epp_requerido: f.epp_requerido,
      grilla_x: borrador.grilla_x, grilla_y: borrador.grilla_y, ancho: borrador.ancho, alto: borrador.alto,
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre de la zona" obligatorio error={errorDe('nombre')}>
          <input className={campo} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} onBlur={tocar('nombre')} />
        </Campo>
        <Campo etiqueta="Máquina" ayuda={f.maquina ? 'Se corta sola si alguien trabaja sin su equipo.' : 'Sin máquina, una falta solo genera la alerta.'}>
          <input className={campo} value={f.maquina} onChange={(e) => setF({ ...f, maquina: e.target.value })} placeholder="Ej: Sierra circular" />
        </Campo>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Equipo de protección obligatorio</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(NOMBRES_EPP).map(([clave, nombre]) => (
            <label key={clave} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
              f.epp_requerido.includes(clave) ? 'border-marca bg-marca/15' : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}>
              <input type="checkbox" className="mr-2 accent-marca" checked={f.epp_requerido.includes(clave)} onChange={() => alternarEpp(clave)} />
              {nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Lugar en el mapa <span className="font-normal text-zinc-500">(en celdas)</span></legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {NUMEROS.map(({ nombre, etiqueta, min }) => (
            <label key={nombre} className="text-xs text-zinc-500 dark:text-zinc-400">{etiqueta}
              <input type="number" min={min} max="20" className={`${campo} mt-1`} value={f[nombre]} onChange={(e) => setF({ ...f, [nombre]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="mt-3"><MapaFabrica zonas={[...zonas.filter((z) => z.id !== borrador.id), borrador]} seleccionada={borrador.id} /></div>
        {errores.lugar && <p role="alert" className={`mt-2 ${mensajeError}`}>{errores.lugar}</p>}
      </fieldset>

      {error && <p role="alert" className={mensajeError}>{error}</p>}
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button type="button" className={botonSecundario} onClick={onCancelar}>Cancelar</button>
        <button type="submit" className={botonPrimario} disabled={guardando || choques.length > 0}>
          {guardando ? 'Guardando…' : inicial.id ? 'Guardar cambios' : 'Crear zona'}
        </button>
      </div>
    </form>
  )
}
