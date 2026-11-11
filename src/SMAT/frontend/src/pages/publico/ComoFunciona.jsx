// "Cómo funciona": los pasos en detalle, el esquema del sistema, la app y el cuidado de los datos.
import { Caracteristica, EncabezadoPagina, LlamadoDemo, Seccion } from '../../components/publico/Bloques.jsx'
import Captura from '../../components/publico/Captura.jsx'
import Pasos from '../../components/publico/Pasos.jsx'
import RenderEmbebido from '../../components/RenderEmbebido.jsx'
import Icono from '../../components/Icono.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

// Esquema: qué partes hay y cómo se hablan
const PARTES = [
  { icono: 'robot', nombre: 'Robot', detalle: 'ESP32-S3 + cámara ESP32-CAM' },
  { icono: 'ia', nombre: 'Servidor de IA', detalle: 'YOLO + reconocimiento facial' },
  { icono: 'panel', nombre: 'Plataforma web', detalle: 'Alertas, mapa, reportes' },
  { icono: 'maquina', nombre: 'Máquina', detalle: 'ESP32 + relé de corte' },
]

const APP = [
  { icono: 'panel', titulo: 'Panel en vivo', texto: 'Alertas del día, tendencia de la semana y el mapa de la fábrica con el robot moviéndose.' },
  { icono: 'robot', titulo: 'Control del robot', texto: 'Video en vivo, ruta por zonas, iniciar, pausar y parada de emergencia.' },
  { icono: 'zonas', titulo: 'Zonas y máquinas', texto: 'Qué equipo exige cada zona y qué máquina se corta si alguien no lo usa.' },
  { icono: 'empleados', titulo: 'Empleados', texto: 'Cada uno con su usuario: ve sus alertas, su cumplimiento y sus fotos.' },
  { icono: 'reportes', titulo: 'Historial y reportes', texto: 'Filtros por zona, empleado, falta y fecha; listo para inspecciones.' },
  { icono: 'auditoria', titulo: 'Auditoría', texto: 'Quién resolvió cada alerta y quién reactivó cada máquina, con fecha y hora.' },
]

const PRIVACIDAD = [
  'Las fotos de la cara se cargan solo con el consentimiento del empleado (Ley 25.326).',
  'Cada empleado ve sus fotos y las puede borrar cuando quiera desde su perfil.',
  'Al dar de baja a alguien, sus fotos se borran.',
  'Ninguna foto es pública: solo las ve el encargado o la persona que aparece.',
]

function Esquema() {
  return (
    <ol className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]" aria-label="Esquema del sistema">
      {PARTES.map((p, i) => (
        <li key={p.nombre} className="contents">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 md:flex-col md:text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-marca/15 text-marca-oscuro dark:text-marca"><Icono nombre={p.icono} /></span>
            <span><span className="block font-semibold">{p.nombre}</span><span className="block text-xs text-zinc-500 dark:text-zinc-400">{p.detalle}</span></span>
          </div>
          {i < PARTES.length - 1 && (
            <span aria-hidden="true" className="grid place-items-center text-zinc-400"><Icono nombre="flecha" className="size-5 rotate-90 md:rotate-0" /></span>
          )}
        </li>
      ))}
    </ol>
  )
}

export default function ComoFunciona() {
  useTituloPagina('Cómo funciona', 'Un robot con cámara recorre la planta, la IA detecta la falta de casco, avisa con foto y detiene la máquina de esa zona.')

  return (
    <>
      <EncabezadoPagina antetitulo="Cómo funciona" titulo="Un robot, una IA y una plataforma que trabajan juntos">
        DROID-E3D controla el uso del equipo de protección personal durante todo el turno y actúa solo
        donde hace falta: en la zona y en la máquina de la persona sin equipo.
      </EncabezadoPagina>

      <Seccion antetitulo="Paso a paso" titulo="Qué pasa cuando alguien trabaja sin su equipo">
        <Pasos detalle />
      </Seccion>

      <Seccion antetitulo="El robot">
        <div className="mt-6"><RenderEmbebido archivo="robot" titulo="Robot SMAT: modelo 3D del robot" /></div>
        {/* Hasta que el render se actualice en Claude: muestra el robot anterior (decisión 008) */}
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Modelo de diseño: el robot actual cambió a ruedas y a otras piezas. Este modelo se va a actualizar.
        </p>
      </Seccion>

      <Seccion gris antetitulo="El sistema" titulo="Cuatro partes conectadas por la red de la planta"
               descripcion="El robot y las máquinas consultan a la plataforma cada 1 o 2 segundos. Si el robot deja de responder 10 segundos, la web lo muestra como desconectado.">
        <Esquema />
      </Seccion>

      <Seccion antetitulo="La plataforma" titulo="Todo desde la web, en la PC o en el celular">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <Captura nombre="robot" alt="Página de control del robot con video, botones de órdenes y ruta por zonas" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {APP.slice(0, 3).map((a) => <Caracteristica key={a.titulo} icono={a.icono} titulo={a.titulo}>{a.texto}</Caracteristica>)}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {APP.slice(3).map((a) => <Caracteristica key={a.titulo} icono={a.icono} titulo={a.titulo}>{a.texto}</Caracteristica>)}
        </div>
      </Seccion>

      <Seccion gris antetitulo="Datos personales" titulo="Cuida al trabajador, no lo persigue">
        <ul className="grid gap-3 md:grid-cols-2">
          {PRIVACIDAD.map((t) => (
            <li key={t} className="flex gap-3 rounded-xl bg-white p-4 text-sm dark:bg-zinc-900">
              <Icono nombre="candado" className="size-5 shrink-0 text-ok" />{t}
            </li>
          ))}
        </ul>
      </Seccion>

      <div className="pt-16"><LlamadoDemo /></div>
    </>
  )
}
