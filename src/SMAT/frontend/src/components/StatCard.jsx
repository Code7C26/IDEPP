// Tarjeta con un número grande, y opcionalmente su tendencia y un mini gráfico.
// Ej: <StatCard titulo="Hoy" valor={3} icono="reportes" tono="marca"
//               tendencia={calcularTendencia(3, 1, 'ayer')} serie={[0, 1, 3]} />
// icono es opcional: en pantallas angostas conviene omitirlo para que el título tenga lugar.
// compacta: menos relleno y letra más chica en el celular, para poner 3 tarjetas en una fila.
import Icono from './Icono.jsx'
import MiniGrafico from './MiniGrafico.jsx'

const TONOS = {
  marca: 'bg-marca/15 text-marca-oscuro dark:text-marca',
  alerta: 'bg-alerta/10 text-alerta',
  ok: 'bg-ok/10 text-ok',
  neutro: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}
// En alertas, que suba es malo (rojo) y que baje es bueno (verde)
const TENDENCIA = {
  sube: { flecha: '▲', clase: 'text-red-700 bg-alerta/10 dark:text-red-400' },
  baja: { flecha: '▼', clase: 'text-green-700 bg-ok/10 dark:text-green-400' },
  igual: { flecha: '■', clase: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300' },
}

export default function StatCard({ titulo, valor, detalle, icono, tono = 'neutro', tendencia, serie, compacta = false }) {
  const t = tendencia && TENDENCIA[tendencia.direccion]
  return (
    <div className={`flex min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${compacta ? 'p-2.5 sm:p-5' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`min-w-0 font-medium text-zinc-500 wrap-anywhere dark:text-zinc-400 ${compacta ? 'text-xs sm:text-sm' : 'text-sm'}`}>{titulo}</p>
        {icono && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${TONOS[tono]}`}>
            <Icono nombre={icono} />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{valor ?? '—'}</p>
      {t && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${t.clase}`}>
            <span aria-hidden="true" className="text-[9px]">{t.flecha}</span>{tendencia.texto}
          </span>
        </p>
      )}
      {detalle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detalle}</p>}
      {serie && <div className="mt-auto pt-3"><MiniGrafico valores={serie} tono={tono === 'neutro' ? 'neutro' : tono} etiqueta={titulo} /></div>}
    </div>
  )
}
