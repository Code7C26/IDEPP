// Barra de filtros configurable. Cada campo puede ser 'select', 'fecha' o 'texto'.
// Ej: <Filtros campos={[{ nombre: 'estado', etiqueta: 'Estado', tipo: 'select',
//                         opciones: [{ valor: 'activa', texto: 'Activas' }] },
//                       { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha' }]}
//              valores={filtros} onCambiar={setFiltros} />
import { campo } from '../utils/estilos.js'

const claseCampo = campo

export default function Filtros({ campos, valores, onCambiar }) {
  const cambiar = (nombre, valor) => onCambiar({ ...valores, [nombre]: valor })
  const hayFiltros = Object.values(valores).some((v) => v !== '' && v != null)

  return (
    <div className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] dark:border-zinc-800 dark:bg-zinc-900">
      {campos.map((campo) => (
        <label key={campo.nombre} className="min-w-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {campo.etiqueta}
          <div className="mt-1">
            {campo.tipo === 'select' ? (
              <select className={claseCampo} value={valores[campo.nombre] ?? ''}
                      onChange={(e) => cambiar(campo.nombre, e.target.value)}>
                <option value="">Todos</option>
                {campo.opciones.map((op) => <option key={op.valor} value={op.valor}>{op.texto}</option>)}
              </select>
            ) : (
              <input type={campo.tipo === 'fecha' ? 'date' : 'text'} className={claseCampo}
                     value={valores[campo.nombre] ?? ''} placeholder={campo.placeholder}
                     onChange={(e) => cambiar(campo.nombre, e.target.value)} />
            )}
          </div>
        </label>
      ))}
      {hayFiltros && (
        <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => onCambiar(Object.fromEntries(campos.map((c) => [c.nombre, ''])))}>
          Limpiar
        </button>
      )}
    </div>
  )
}
