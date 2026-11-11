// Los 4 pasos de DROID-E3D: cámara → IA → alerta → máquina detenida.
// detalle = true agrega una explicación más larga de cada paso (página "Cómo funciona").
import Icono from '../Icono.jsx'

export const PASOS = [
  { icono: 'camara', titulo: 'El robot recorre', texto: 'Una cámara en el robot filma cada zona de la planta mientras recorre su ruta.',
    detalle: 'El robot, con ruedas y un ESP32-S3, sigue la ruta que arma el encargado en la web y espera unos segundos en cada zona. Se puede iniciar, pausar o frenar en emergencia desde el celular.' },
  { icono: 'ia', titulo: 'La IA detecta', texto: 'YOLO revisa que tengan casco (guantes, lentes y chaleco son lo próximo) y reconoce de quién es la cara.',
    detalle: 'Un servidor con inteligencia artificial analiza el video. Si alguien no tiene casco durante varios cuadros seguidos, lo marca y busca su cara entre los empleados que dieron su consentimiento.' },
  { icono: 'alerta', titulo: 'Llega la alerta', texto: 'El encargado la ve al instante, con la foto, la zona y la confianza de la IA.',
    detalle: 'La alerta aparece en el panel con la foto del momento. El encargado la revisa y la marca como resuelta; todo queda registrado en el historial y en la auditoría.' },
  { icono: 'maquina', titulo: 'La máquina frena', texto: 'Solo la máquina de esa zona se detiene, hasta que el encargado la reactive.',
    detalle: 'Un relé en la máquina consulta al sistema cada 1 o 2 segundos. Cuando hay una falta se corta; el resto de la planta sigue trabajando. Solo el encargado la vuelve a habilitar.' },
]

export default function Pasos({ detalle = false }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PASOS.map((p, i) => (
        <li key={p.titulo} className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl bg-tinta text-marca dark:bg-zinc-800"><Icono nombre={p.icono} /></span>
            <span className="text-3xl font-black text-zinc-200 tabular-nums dark:text-zinc-800" aria-hidden="true">{i + 1}</span>
          </div>
          <h3 className="mt-4 font-semibold"><span className="sr-only">Paso {i + 1}: </span>{p.titulo}</h3>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{detalle ? p.detalle : p.texto}</p>
        </li>
      ))}
    </ol>
  )
}
