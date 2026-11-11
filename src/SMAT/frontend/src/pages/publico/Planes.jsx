// Planes y precios. Números de docs/SMAT/EMPRESA-SMAT/05-finanzas/precios.md (precios de lanzamiento en USD).
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono.jsx'
import { botonClaro, botonOscuro, EncabezadoPagina, LlamadoDemo, Seccion } from '../../components/publico/Bloques.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

const PLANES = [
  {
    nombre: 'Plan Compra', recomendado: true, precio: 'USD 2.200', unidad: 'pago único', abono: '+ USD 70 por mes',
    descripcion: 'Comprás el equipo y pagás un abono por la plataforma, el soporte y el mantenimiento.',
    incluye: ['Robot DROID-E3D', 'Corte en 2 máquinas', 'Servidor de IA', 'Instalación y capacitación',
      'Plataforma web y app para toda la planta', 'Soporte remoto y actualizaciones', 'Mantenimiento cada 3 meses'],
    boton: 'Pedir una demo',
  },
  {
    nombre: 'Plan Servicio', recomendado: false, precio: 'USD 260', unidad: 'por mes', abono: 'Mínimo 12 meses · desde 2028',
    descripcion: 'El equipo es de SMAT: pagás una cuota mensual con todo incluido, sin inversión inicial.',
    incluye: ['Equipo de SMAT (robot, corte y servidor de IA)', 'Instalación', 'Plataforma, soporte y mantenimiento', 'Sin pago inicial'],
    boton: 'Quiero que me avisen',
  },
]

const EXTRAS = [
  { titulo: 'Máquina adicional', precio: 'USD 120 c/u', texto: 'Corte por zona, instalado.' },
  { titulo: 'Precio piloto', precio: 'USD 1.100', texto: 'El primer cliente paga el 50 % del pago único a cambio de medir el antes y el después y dar su testimonio.' },
]

function TarjetaPlan({ plan }) {
  return (
    <article className={`relative flex flex-col rounded-3xl border p-8 ${plan.recomendado
      ? 'border-zinc-900 bg-zinc-900 text-white shadow-2xl dark:border-marca/60 dark:bg-zinc-900'
      : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
      {plan.recomendado && <span className="absolute -top-3 left-8 rounded-full bg-marca px-3 py-1 text-xs font-bold text-tinta">Recomendado</span>}
      <h2 className="text-lg font-semibold">{plan.nombre}</h2>
      <p className={`mt-1 text-sm ${plan.recomendado ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{plan.descripcion}</p>
      <p className="mt-6"><span className="text-4xl font-extrabold tracking-tight">{plan.precio}</span> <span className="text-sm opacity-70">{plan.unidad}</span></p>
      <p className={`text-sm font-medium ${plan.recomendado ? 'text-marca' : 'text-zinc-600 dark:text-zinc-300'}`}>{plan.abono}</p>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {plan.incluye.map((i) => (
          <li key={i} className="flex gap-2"><Icono nombre="ok" className={`size-5 shrink-0 ${plan.recomendado ? 'text-marca' : 'text-ok'}`} />{i}</li>
        ))}
      </ul>
      <Link to="/contacto" className={`mt-8 ${plan.recomendado ? 'inline-flex items-center justify-center rounded-xl bg-marca px-5 py-3 text-sm font-bold text-tinta hover:bg-marca-oscuro' : botonClaro}`}>
        {plan.boton}
      </Link>
    </article>
  )
}

export default function Planes() {
  useTituloPagina('Planes', 'Plan Compra: USD 2.200 de pago único + USD 70 por mes con plataforma, soporte y mantenimiento. Precios de lanzamiento.')

  return (
    <>
      <EncabezadoPagina antetitulo="Planes" titulo="Menos que unos pocos meses de un supervisor">
        El primer año del Plan Compra (USD 3.040) cuesta menos que unos meses de sueldo de una persona dedicada a controlar
        el equipo de protección, y DROID-E3D trabaja en todos los turnos y deja registro.
      </EncabezadoPagina>

      <Seccion>
        <div className="grid gap-8 lg:grid-cols-2">{PLANES.map((p) => <TarjetaPlan key={p.nombre} plan={p} />)}</div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {EXTRAS.map((e) => (
            <div key={e.titulo} className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200/80 p-5 dark:border-zinc-800">
              <div><p className="font-semibold">{e.titulo}</p><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{e.texto}</p></div>
              <p className="shrink-0 font-bold whitespace-nowrap">{e.precio}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          Precios de lanzamiento en dólares; se facturan en pesos al tipo de cambio vendedor del Banco Nación del día. Se revisan cada 6 meses.
        </p>
      </Seccion>

      <Seccion gris antetitulo="Qué incluye el abono" titulo="Sin sorpresas">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900">
            <p className="font-semibold text-ok">Incluido</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Acceso a la web para todos los usuarios de la planta, alertas, historial, reportes, actualizaciones,
              soporte remoto en horario laboral, una visita de mantenimiento cada 3 meses y cambio de piezas por desgaste normal.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900">
            <p className="font-semibold text-alerta">No incluido</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Roturas por mal uso, traslado de la instalación a otra planta y obras eléctricas
              (las hace el electricista de la fábrica).</p>
          </div>
        </div>
        <Link to="/contacto" className={`mt-8 ${botonOscuro}`}>Consultar por mi planta <Icono nombre="flecha" className="size-4" /></Link>
      </Seccion>

      <div className="pt-16"><LlamadoDemo /></div>
    </>
  )
}
