// "Contacto": formulario para pedir una demo. No hay servidor de correo: el mensaje se arma
// y se abre en el mail o en WhatsApp de quien escribe, dirigido a SMAT (ver utils/contacto.js).
import { useState } from 'react'
import Campo from '../../components/Campo.jsx'
import Icono from '../../components/Icono.jsx'
import { EncabezadoPagina, Seccion } from '../../components/publico/Bloques.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'
import useValidacion from '../../hooks/useValidacion.js'
import { EMAIL, enlaceMail, enlaceWhatsapp, WHATSAPP } from '../../utils/contacto.js'
import { campo } from '../../utils/estilos.js'

const QUE_PASA = [
  'Te respondemos en 1 o 2 días hábiles.',
  'Coordinamos una demo de 20 minutos (en tu planta o por videollamada).',
  'Si te sirve, armamos una propuesta según tus zonas y máquinas.',
]

export default function Contacto() {
  useTituloPagina('Contacto', 'Pedí una demo de DROID-E3D: el robot que controla el uso del equipo de protección en tu fábrica.')
  const [datos, setDatos] = useState({ nombre: '', empresa: '', mensaje: 'Me gustaría ver una demo de DROID-E3D.' })
  const { error, tocar, puedeEnviar } = useValidacion({
    nombre: datos.nombre.trim() ? '' : 'Escribí tu nombre.',
    mensaje: datos.mensaje.trim().length >= 10 ? '' : 'Contanos un poco más (al menos 10 letras).',
  })
  const cambiar = (clave) => (e) => setDatos({ ...datos, [clave]: e.target.value })
  const hayCanal = Boolean(EMAIL || WHATSAPP)

  // Abre el mail o WhatsApp con el mensaje ya escrito (si el formulario está bien)
  const abrir = (armarEnlace) => {
    if (!puedeEnviar()) return
    const limpio = { nombre: datos.nombre.trim(), empresa: datos.empresa.trim(), mensaje: datos.mensaje.trim() }
    window.open(armarEnlace(limpio), '_blank', 'noopener')
  }

  return (
    <>
      <EncabezadoPagina antetitulo="Contacto" titulo="Pedí una demo">
        Contanos sobre tu planta y te mostramos DROID-E3D funcionando: la alerta con foto, la parada de máquina y el control del robot.
      </EncabezadoPagina>

      <Seccion>
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <form noValidate onSubmit={(e) => e.preventDefault()}
                className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Nombre" obligatorio error={error('nombre')}>
                <input className={campo} value={datos.nombre} autoComplete="name" onChange={cambiar('nombre')} onBlur={tocar('nombre')} />
              </Campo>
              <Campo etiqueta="Empresa" ayuda="Opcional.">
                <input className={campo} value={datos.empresa} autoComplete="organization" onChange={cambiar('empresa')} />
              </Campo>
            </div>
            <Campo etiqueta="Mensaje" obligatorio error={error('mensaje')} ayuda="Por ejemplo: cuántas zonas y máquinas tiene la planta.">
              <textarea rows={5} className={campo} value={datos.mensaje} onChange={cambiar('mensaje')} onBlur={tocar('mensaje')} />
            </Campo>

            {hayCanal ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                {EMAIL && (
                  <button type="button" onClick={() => abrir(enlaceMail)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
                    <Icono nombre="mail" className="size-4" /> Enviar por mail
                  </button>
                )}
                {WHATSAPP && (
                  <button type="button" onClick={() => abrir(enlaceWhatsapp)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-5 py-3 text-sm font-semibold text-white hover:bg-[#178c46]">
                    <Icono nombre="chat" className="size-4" /> Enviar por WhatsApp
                  </button>
                )}
              </div>
            ) : (
              <p role="status" className="rounded-lg bg-naranja/10 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
                {/* Aparece si faltan VITE_CONTACTO_EMAIL y VITE_CONTACTO_WHATSAPP en el .env del frontend */}
                Estamos configurando los canales de contacto. Muy pronto vas a poder escribirnos desde acá.
              </p>
            )}
          </form>

          <aside>
            <h2 className="text-lg font-semibold">Qué pasa después</h2>
            <ol className="mt-4 space-y-4">
              {QUE_PASA.map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-marca text-sm font-bold text-tinta">{i + 1}</span>
                  <span className="pt-0.5 text-zinc-600 dark:text-zinc-300">{t}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              ¿Ya usás DROID-E3D? Entrá a la app con tu usuario desde <strong>Ingresar</strong>, arriba a la derecha.
            </p>
          </aside>
        </div>
      </Seccion>
    </>
  )
}
