// Plano de la fábrica en grilla (SVG). Cada zona es un rectángulo de celdas.
//  - verde: todo en orden · rojo: alertas activas · naranja: máquina detenida
//  - cada zona muestra su máquina (con su estado) y los íconos del EPP obligatorio
//  - el robot se mueve de zona en zona con una animación; su recorrido se dibuja punteado
// Props:
//   zonas            lista de zonas (con grilla_x, grilla_y, ancho, alto)
//   alertasPorZona   { zona_id: cantidad de alertas activas }; null si no se conocen (el empleado solo
//                    ve las suyas): el mapa no dice "Todo en orden", solo si la máquina está parada
//   robot            { zona_actual_id, conectado } (opcional)
//   ruta             lista de zona_id en el orden del recorrido (opcional)
//   seleccionada     id de la zona resaltada (opcional)
//   onSeleccionar    función(zona) al tocar una zona (opcional; si no se pasa, el mapa es solo para mirar)
import { estadoVisible, medidasGrilla, resumenZona } from '../utils/mapa.js'
import { NOMBRES_EPP } from '../utils/formato.js'
import Icono from './Icono.jsx'
import RobotEnMapa from './RobotEnMapa.jsx'

const CELDA = 100   // cada celda mide 100 unidades dentro del SVG (se escala sola a la pantalla)
const MARGEN = 5

const COLORES = {
  ok: { caja: 'fill-ok/15 stroke-ok', texto: 'fill-ok' },
  alerta: { caja: 'fill-alerta/20 stroke-alerta', texto: 'fill-alerta' },
  detenida: { caja: 'fill-naranja/20 stroke-naranja', texto: 'fill-naranja' },
  neutro: { caja: 'fill-zinc-200/40 stroke-zinc-400 dark:fill-zinc-700/30 dark:stroke-zinc-600', texto: 'fill-zinc-500 dark:fill-zinc-400' },
}

// Borde claro detrás de cada letra: el texto se sigue leyendo aunque el recorrido pase por debajo
const HALO = '[paint-order:stroke] [stroke-linejoin:round] stroke-white/60 stroke-[4px] dark:stroke-zinc-900/60'

// Rectángulo de la zona dentro del SVG (en unidades del dibujo)
function medidas(zona) {
  return {
    x: zona.grilla_x * CELDA + MARGEN, y: zona.grilla_y * CELDA + MARGEN,
    ancho: zona.ancho * CELDA - MARGEN * 2, alto: zona.alto * CELDA - MARGEN * 2,
  }
}
const centro = (zona) => [(zona.grilla_x + zona.ancho / 2) * CELDA, (zona.grilla_y + zona.alto / 2) * CELDA]

function ZonaEnMapa({ zona, alertasPorZona, seleccionada, onSeleccionar }) {
  const alertas = alertasPorZona?.[zona.id] || 0
  const estado = estadoVisible(zona, alertasPorZona)
  const { x, y, ancho, alto } = medidas(zona)
  const interactiva = Boolean(onSeleccionar)
  const textoEstado = resumenZona(zona, estado, alertas)
  const resumen = `${zona.nombre}: ${estado === 'alerta' ? `${alertas} alerta(s) activa(s)` : textoEstado}`
  const epp = zona.epp_requerido || []

  return (
    <g role={interactiva ? 'button' : 'img'} aria-label={resumen} tabIndex={interactiva ? 0 : undefined}
       className={interactiva ? 'cursor-pointer outline-none [&:focus-visible>rect]:stroke-[5] [&:hover>rect]:stroke-[4]' : ''}
       onClick={interactiva ? () => onSeleccionar(zona) : undefined}
       onKeyDown={interactiva ? (e) => (e.key === 'Enter' || e.key === ' ') && onSeleccionar(zona) : undefined}>
      <rect x={x} y={y} width={ancho} height={alto} rx="12"
            className={`${COLORES[estado].caja} transition-[stroke-width] ${seleccionada ? 'stroke-[6]' : 'stroke-[2.5]'}`} />
      <text x={x + 14} y={y + 38} className={`fill-zinc-900 text-[29px] font-bold dark:fill-zinc-100 ${HALO}`}>{zona.nombre}</text>

      {/* Máquina: engranaje verde si anda, naranja si está detenida */}
      {zona.maquina && ancho >= 190 && (
        <g className="fill-zinc-600 dark:fill-zinc-300">
          <svg x={x + 12} y={y + 48} width="24" height="24"
               className={zona.maquina_activa ? 'text-ok' : 'text-naranja'}><Icono nombre="maquina" className="" /></svg>
          <text x={x + 42} y={y + 67} className={`text-[21px] ${HALO}`}>{zona.maquina}</text>
        </g>
      )}

      {/* EPP obligatorio: un ícono por elemento */}
      {epp.length > 0 && alto >= 150 && (
        <g className="text-zinc-500 dark:text-zinc-400">
          <title>{`EPP: ${epp.map((e) => NOMBRES_EPP[e] || e).join(', ')}`}</title>
          {epp.map((e, i) => (
            <svg key={e} x={x + 12 + i * 32} y={y + alto - 80} width="26" height="26"><Icono nombre={e} className="" /></svg>
          ))}
        </g>
      )}

      <text x={x + 14} y={y + alto - 16} className={`text-[22px] font-semibold ${COLORES[estado].texto} ${HALO}`}>
        {textoEstado}
      </text>
    </g>
  )
}

// Recorrido del robot: línea punteada que une el centro de cada zona y vuelve a la primera.
// Se dibuja debajo de las zonas, pero se ve a través de ellas: por eso los textos llevan HALO.
function Recorrido({ zonas, ruta }) {
  const puntos = ruta.map((id) => zonas.find((z) => z.id === id)).filter(Boolean).map(centro)
  if (puntos.length < 2) return null
  return (
    <polygon points={puntos.map((p) => p.join(',')).join(' ')} fill="none" aria-hidden="true"
             className="recorrido pointer-events-none stroke-tinta/30 dark:stroke-zinc-300/30" strokeWidth="4" strokeDasharray="10 12" strokeLinejoin="round" />
  )
}

// Número de parada (1, 2, 3...) arriba a la derecha de cada zona del recorrido
function Paradas({ zonas, ruta }) {
  return ruta.map((id, i) => {
    const zona = zonas.find((z) => z.id === id)
    if (!zona) return null
    const { x, y, ancho } = medidas(zona)
    return (
      <g key={`${id}-${i}`} transform={`translate(${x + ancho - 30 - (ruta.indexOf(id) !== i ? 40 : 0)} ${y + 30})`} className="pointer-events-none">
        <title>{`Parada ${i + 1} del robot`}</title>
        <circle r="18" className="fill-tinta dark:fill-zinc-100" />
        <text textAnchor="middle" dy="7" className="fill-white text-[20px] font-bold dark:fill-zinc-900">{i + 1}</text>
      </g>
    )
  })
}

export default function MapaFabrica({ zonas, alertasPorZona = {}, robot, ruta = [], seleccionada, onSeleccionar }) {
  const { columnas, filas } = medidasGrilla(zonas)
  const ancho = columnas * CELDA
  const alto = filas * CELDA
  const zonaRobot = robot && zonas.find((z) => z.id === robot.zona_actual_id)

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full select-none" role="group" aria-label="Plano de la fábrica">
      <defs>
        <pattern id="celdas" width={CELDA} height={CELDA} patternUnits="userSpaceOnUse">
          <path d={`M ${CELDA} 0 L 0 0 0 ${CELDA}`} fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="4 6" />
        </pattern>
      </defs>
      <rect width={ancho} height={alto} rx="14" className="fill-zinc-50 stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700" />
      <rect width={ancho} height={alto} fill="url(#celdas)" />
      <Recorrido zonas={zonas} ruta={ruta} />
      {zonas.map((zona) => (
        <ZonaEnMapa key={zona.id} zona={zona} alertasPorZona={alertasPorZona}
                    seleccionada={seleccionada === zona.id} onSeleccionar={onSeleccionar} />
      ))}
      <Paradas zonas={zonas} ruta={ruta} />
      {/* El robot va arriba de todo; abajo a la derecha de la zona donde está */}
      {zonaRobot && (() => {
        const m = medidas(zonaRobot)
        return <RobotEnMapa x={m.x + m.ancho - 34} y={m.y + m.alto - 34} conectado={robot.conectado} />
      })()}
    </svg>
  )
}

// Referencia de colores para poner debajo del mapa
export function LeyendaMapa({ conRecorrido = false }) {
  const item = (color, texto) => (
    <li className="flex items-center gap-1.5"><span className={`size-3 rounded-sm ${color}`} />{texto}</li>
  )
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
      {item('bg-ok', 'En orden')}{item('bg-alerta', 'Alertas activas')}{item('bg-naranja', 'Máquina detenida')}
      <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-marca ring-2 ring-tinta" />Robot</li>
      {conRecorrido && <li className="flex items-center gap-1.5"><span className="grid size-3.5 place-items-center rounded-full bg-tinta text-[8px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">1</span>Parada del recorrido</li>}
      <li className="flex items-center gap-1.5"><Icono nombre="maquina" className="size-3.5" />Máquina</li>
      <li className="flex items-center gap-1.5"><Icono nombre="casco" className="size-3.5" />EPP obligatorio</li>
    </ul>
  )
}
