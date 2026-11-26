// Página principal pública: qué es DROID-E3D, beneficios, pasos y a quién le sirve.
// Textos: docs/SMAT/EMPRESA-SMAT (propuesta de valor y misión).
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono.jsx'
import { Antetitulo, botonClaro, botonOscuro, Caracteristica, LlamadoDemo, Seccion } from '../../components/publico/Bloques.jsx'
import Captura from '../../components/publico/Captura.jsx'
import Pasos from '../../components/publico/Pasos.jsx'
import RenderEmbebido from '../../components/RenderEmbebido.jsx'
import { useIdioma } from '../../context/IdiomaContext.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

const BENEFICIOS = [
  { icono: 'alerta', titulo: 'Menos accidentes', texto: 'Alertas por zona y por empleado, con el porcentaje de cumplimiento de cada uno.' },
  { icono: 'robot', titulo: 'Control sin sumar personal', texto: 'El robot recorre las zonas todo el turno; el encargado ve todo desde el celular.' },
  { icono: 'reloj', titulo: 'Respuesta inmediata', texto: 'La alerta llega en segundos y el robot da la alarma en la zona, en el momento.' },
  { icono: 'documento', titulo: 'Registro para la ART', texto: 'Historial con fecha, zona, falta y foto, y quién resolvió cada alerta.' },
  { icono: 'perfil', titulo: 'Cambio de hábito', texto: 'Cada empleado ve su propio cumplimiento y su racha de días sin alertas.' },
  { icono: 'candado', titulo: 'Respeto por las personas', texto: 'Las fotos se usan solo para seguridad, con consentimiento y por tiempo limitado.' },
]

const PARA_QUIEN = [
  { rol: 'Dueño', frase: 'Un accidente evitado paga el sistema.' },
  { rol: 'Jefe de planta', frase: 'El robot avisa en la zona con la falta; ninguna máquina se frena y la planta sigue.' },
  { rol: 'Seguridad e higiene', frase: 'Todo queda registrado con foto, listo para la inspección.' },
  { rol: 'Empleado', frase: 'Te avisa a vos primero, y podés ver tu propio cumplimiento.' },
]

export default function InicioPublico() {
  const { t } = useIdioma()
  useTituloPagina('', 'DROID-E3D es un robot que recorre la fábrica, detecta con IA a quien trabaja sin su equipo de protección, avisa al instante y da la alarma en la zona.')

  return (
    <>
      <section className="textura-rayas relative overflow-hidden">
        <div className="relative">
        {/* franja oscura a la izquierda, como el costado de la caja */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-4 bg-tinta lg:block" />
        {/* línea naranja con quiebre que cruza la portada, como en la caja */}
        <svg aria-hidden="true" className="absolute top-[13%] left-0 hidden h-6 w-full lg:block" viewBox="0 0 1000 24" preserveAspectRatio="none">
          <path d="M0 3H560L590 21H1000" fill="none" stroke="var(--color-marca)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-6 pt-12 pb-10 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="size-2 shrink-0 rounded-full bg-ok" /> {t('Detecta casco, chaleco y lentes')}
            </p>
            {/* el nombre grande e inclinado, como en la caja */}
            <p aria-hidden="true" className="mt-6 flex items-center justify-center gap-3 font-titulo text-2xl font-black tracking-tight italic lg:justify-start">
              DROID-<span className="-ml-3 text-marca">E3D</span><span className="rayas-marca" />
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-balance md:text-6xl">
              {t('Seguridad que')} <span className="text-marca-oscuro dark:text-marca">{t('recorre la planta')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600 text-pretty max-lg:mx-auto dark:text-zinc-300">
              {t('DROID-E3D es un robot que recorre la fábrica, detecta con inteligencia artificial a quien trabaja sin su equipo de protección, avisa al instante y da la alarma en la zona.')}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link to="/contacto" className={botonOscuro}>{t('Pedir una demo')} <Icono nombre="flecha" className="size-4" /></Link>
              <Link to="/como-funciona" className={botonClaro}>{t('Ver cómo funciona')}</Link>
            </div>
          </div>
          {/* el robot, sobre un círculo naranja con las rayas de la caja */}
          <div aria-hidden="true" className="relative mx-auto aspect-square w-72 sm:w-80 lg:w-full lg:max-w-md">
            <div className="absolute inset-[8%] rounded-full bg-marca" />
            <div className="absolute inset-[8%] rounded-full bg-[repeating-linear-gradient(115deg,transparent_0_18px,rgb(255_255_255/0.18)_18px_30px)]" />
            <span className="rayas-marca-grande absolute -top-1 right-0" />
            <img src="/robot-droid.webp" alt="" width="540" height="640" className="relative mx-auto h-full w-auto drop-shadow-[0_18px_24px_rgb(0_0_0/0.25)]" />
          </div>
        </div>

        </div>

        {/* franja oscura de abajo, como la base de la caja, con los beneficios principales */}
        <div className="relative border-t-4 border-marca bg-tinta text-white">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-6 py-7 md:px-8 lg:grid-cols-4">
            {BENEFICIOS.slice(0, 4).map((b) => (
              <li key={b.titulo} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/15 text-marca"><Icono nombre={b.icono} /></span>
                <span className="font-titulo text-sm font-bold">{t(b.titulo)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 md:px-8">
          <Captura nombre="panel" alt="Panel del encargado con las alertas del día, el mapa de la fábrica y el estado del robot" />
        </div>
      </section>

      <Seccion antetitulo={t('El robot en acción')}>
        <div className="mt-6"><RenderEmbebido archivo="fabrica" titulo="DROID-E3D en la fábrica: simulación del recorrido del robot" /></div>
        <Link to="/juego" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-oscuro hover:underline dark:text-marca">
          {t('Manejalo vos en el juego')} <Icono nombre="flecha" className="size-4" />
        </Link>
      </Seccion>

      <Seccion gris antetitulo={t('Por qué DROID-E3D')} titulo={t('Control continuo del equipo de protección, sin perseguir a nadie')}
               descripcion={t('Pensado para PyMEs industriales que quieren cumplir con la normativa de seguridad e higiene sin sumar supervisores.')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => <Caracteristica key={b.titulo} icono={b.icono} titulo={t(b.titulo)}>{t(b.texto)}</Caracteristica>)}
        </div>
      </Seccion>

      <Seccion antetitulo={t('Cómo funciona')} titulo={t('De la cámara a la alarma, en segundos')}>
        <Pasos />
        <Link to="/como-funciona" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-oscuro hover:underline dark:text-marca">
          {t('Ver el detalle')} <Icono nombre="flecha" className="size-4" />
        </Link>
      </Seccion>

      <Seccion gris>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Antetitulo>{t('Para cada persona de la planta')}</Antetitulo>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{t('Cada uno ve lo que necesita')}</h2>
            <div className="trazo-marca mt-3" aria-hidden="true" />
            <dl className="mt-8 space-y-4">
              {PARA_QUIEN.map((p) => (
                <div key={p.rol} className="rounded-r-xl border-l-4 border-marca bg-white/70 py-3 pr-4 pl-4 dark:bg-zinc-900/60">
                  <dt className="font-titulo text-sm font-extrabold">{t(p.rol)}</dt>
                  <dd className="mt-0.5 text-zinc-600 dark:text-zinc-300">«{t(p.frase)}»</dd>
                </div>
              ))}
            </dl>
          </div>
          <Captura nombre="empleado" movil alt="Inicio del empleado en el celular: estado de su zona, equipo obligatorio y su cumplimiento" />
        </div>
      </Seccion>

      <div className="pt-16"><LlamadoDemo /></div>
    </>
  )
}
