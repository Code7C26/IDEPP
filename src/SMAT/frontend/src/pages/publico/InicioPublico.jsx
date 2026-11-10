// Página principal pública: qué es DROID-E3D, beneficios, pasos y a quién le sirve.
// Textos: docs/SMAT/EMPRESA-SMAT (propuesta de valor y misión).
import { Link } from 'react-router-dom'
import Icono from '../../components/Icono.jsx'
import { Antetitulo, botonClaro, botonOscuro, Caracteristica, LlamadoDemo, Seccion } from '../../components/publico/Bloques.jsx'
import Captura from '../../components/publico/Captura.jsx'
import Pasos from '../../components/publico/Pasos.jsx'
import RenderEmbebido from '../../components/RenderEmbebido.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

const BENEFICIOS = [
  { icono: 'alerta', titulo: 'Menos accidentes', texto: 'Alertas por zona y por empleado, con el porcentaje de cumplimiento de cada uno.' },
  { icono: 'robot', titulo: 'Control sin sumar personal', texto: 'El robot recorre las zonas todo el turno; el encargado ve todo desde el celular.' },
  { icono: 'reloj', titulo: 'Respuesta inmediata', texto: 'La alerta llega en segundos y la máquina de esa zona se detiene hasta que se resuelva.' },
  { icono: 'documento', titulo: 'Registro para la ART', texto: 'Historial con fecha, zona, falta y foto, y quién resolvió cada alerta.' },
  { icono: 'perfil', titulo: 'Cambio de hábito', texto: 'Cada empleado ve su propio cumplimiento y su racha de días sin alertas.' },
  { icono: 'candado', titulo: 'Respeto por las personas', texto: 'Las fotos se usan solo para seguridad, con consentimiento y por tiempo limitado.' },
]

const PARA_QUIEN = [
  { rol: 'Dueño', frase: 'Un accidente evitado paga el sistema.' },
  { rol: 'Jefe de planta', frase: 'Solo se detiene la máquina de la zona con la falta; el resto de la planta sigue.' },
  { rol: 'Seguridad e higiene', frase: 'Todo queda registrado con foto, listo para la inspección.' },
  { rol: 'Empleado', frase: 'Te avisa a vos primero, y podés ver tu propio cumplimiento.' },
]

export default function InicioPublico() {
  useTituloPagina('', 'DROID-E3D es un robot que recorre la fábrica, detecta con IA a quien trabaja sin casco, avisa al instante y detiene la máquina de esa zona.')

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(245,184,0,0.18),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center md:px-8 md:pt-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="size-2 shrink-0 rounded-full bg-ok" /> Hoy detecta casco · Próximo: guantes, lentes y chaleco
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold tracking-tight text-balance md:text-6xl">
            Seguridad que <span className="text-marca-oscuro dark:text-marca">recorre la planta</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 text-pretty dark:text-zinc-300">
            DROID-E3D es un robot que recorre la fábrica, detecta con inteligencia artificial a quien trabaja sin su equipo
            de protección, avisa al instante y detiene la máquina de esa zona.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contacto" className={botonOscuro}>Pedir una demo <Icono nombre="flecha" className="size-4" /></Link>
            <Link to="/como-funciona" className={botonClaro}>Ver cómo funciona</Link>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
          <Captura nombre="panel" alt="Panel del encargado con las alertas del día, el mapa de la fábrica y el estado del robot" />
        </div>
      </section>

      <Seccion antetitulo="El robot en acción">
        <div className="mt-6"><RenderEmbebido archivo="fabrica" titulo="SMAT en la fábrica: simulación del recorrido del robot" /></div>
        <Link to="/juego" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-oscuro hover:underline dark:text-marca">
          Manejalo vos en el juego <Icono nombre="flecha" className="size-4" />
        </Link>
      </Seccion>

      <Seccion gris antetitulo="Por qué DROID-E3D" titulo="Control continuo del equipo de protección, sin perseguir a nadie"
               descripcion="Pensado para PyMEs industriales que quieren cumplir con la normativa de seguridad e higiene sin sumar supervisores.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => <Caracteristica key={b.titulo} icono={b.icono} titulo={b.titulo}>{b.texto}</Caracteristica>)}
        </div>
      </Seccion>

      <Seccion antetitulo="Cómo funciona" titulo="De la cámara a la máquina detenida, en segundos">
        <Pasos />
        <Link to="/como-funciona" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-oscuro hover:underline dark:text-marca">
          Ver el detalle <Icono nombre="flecha" className="size-4" />
        </Link>
      </Seccion>

      <Seccion gris>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Antetitulo>Para cada persona de la planta</Antetitulo>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Cada uno ve lo que necesita</h2>
            <dl className="mt-8 space-y-5">
              {PARA_QUIEN.map((p) => (
                <div key={p.rol} className="border-l-2 border-marca pl-4">
                  <dt className="text-sm font-semibold">{p.rol}</dt>
                  <dd className="mt-0.5 text-zinc-600 dark:text-zinc-300">«{p.frase}»</dd>
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
