// "Nosotros": misión, visión, valores y el equipo. Textos de docs/SMAT/EMPRESA-SMAT (01-identidad y 02-organizacion). Empresa: IDEPP.
import Avatar from '../../components/Avatar.jsx'
import { Antetitulo, EncabezadoPagina, LlamadoDemo, Seccion } from '../../components/publico/Bloques.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

const VALORES = [
  { titulo: 'Seguridad primero', texto: 'No entregamos nada que no hayamos probado. Ante la duda, el robot frena.' },
  { titulo: 'Respeto por las personas', texto: 'DROID-E3D cuida al trabajador, no lo persigue: las fotos se usan solo para seguridad, con consentimiento y por tiempo limitado.' },
  { titulo: 'Transparencia', texto: 'Decimos qué hace y qué no hace el sistema. Cada alerta muestra la confianza de la IA y se puede revisar.' },
  { titulo: 'Aprender haciendo', texto: 'Documentamos cada decisión y cada error para mejorar el producto y el equipo.' },
  { titulo: 'Trabajo en equipo', texto: 'Las decisiones importantes se toman entre los socios y quedan registradas.' },
]

// El equipo de DROID-E3D dentro de IDEPP: Tiziano y Morena. Las otras socias hacen Touch ID y no salen en esta web.
const EQUIPO = [
  { nombre: 'Tiziano Tomás Donato', rol: 'Socio · Software y web', texto: 'Plataforma web, base de datos, servidor y despliegue.' },
  { nombre: 'Morena Boeris', rol: 'Socia · Hardware e IA', texto: 'Robot con ruedas y ESP32-S3, corte de máquinas, cámara, YOLO y reconocimiento facial.' },
]

export default function Nosotros() {
  useTituloPagina('Nosotros', 'IDEPP diseña, fabrica e instala DROID-E3D para que cada trabajador vuelva a su casa sano.')

  return (
    <>
      <EncabezadoPagina antetitulo="Nosotros" titulo="Que cada trabajador vuelva a su casa sano">
        IDEPP diseña, fabrica e instala DROID-E3D para controlar de forma automática y respetuosa que cada persona use su equipo de protección.
      </EncabezadoPagina>

      <Seccion>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-tinta p-8 text-white">
            <Antetitulo>Misión</Antetitulo>
            <p className="mt-4 text-xl leading-relaxed font-semibold text-pretty">
              Ayudar a las fábricas a que cada trabajador vuelva a su casa sano, controlando de forma automática y respetuosa que use su equipo de protección personal.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 p-8 dark:border-zinc-800">
            <Antetitulo>Visión 2029</Antetitulo>
            <p className="mt-4 text-lg font-semibold text-pretty">Ser la opción de referencia para las PyMEs industriales de Argentina que quieren cumplir con la normativa de seguridad e higiene sin sumar supervisores.</p>
            <ul className="mt-4 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              <li>· 25 fábricas usando DROID-E3D.</li>
              <li>· Una segunda versión que también detecte riesgos del entorno (derrames, pasillos obstruidos).</li>
              <li>· Soporte técnico propio en Córdoba, donde empezamos, y en el AMBA.</li>
            </ul>
          </div>
        </div>
      </Seccion>

      <Seccion gris antetitulo="Valores" titulo="Cómo trabajamos">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALORES.map((v) => (
            <div key={v.titulo} className="rounded-2xl bg-white p-6 dark:bg-zinc-900">
              <dt className="font-semibold">{v.titulo}</dt>
              <dd className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{v.texto}</dd>
            </div>
          ))}
        </dl>
      </Seccion>

      <Seccion antetitulo="El equipo" titulo="Quiénes hacemos DROID-E3D"
               descripcion="DROID-E3D es un producto de IDEPP. Lo diseñamos y construimos entre los dos.">
        <div className="grid gap-4 md:grid-cols-2">
          {EQUIPO.map((p) => (
            <article key={p.nombre} className="flex gap-4 rounded-2xl border border-zinc-200/80 p-6 dark:border-zinc-800">
              <Avatar nombre={p.nombre} tamano="lg" />
              <div>
                <h3 className="font-semibold">{p.nombre}</h3>
                <p className="text-sm font-medium text-marca-oscuro dark:text-marca">{p.rol}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </Seccion>

      <LlamadoDemo />
    </>
  )
}
