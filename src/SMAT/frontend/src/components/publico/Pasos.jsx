// Los 4 pasos de DROID-E3D: cámara → IA → alerta → el robot se detiene y da la alarma.
// detalle = true agrega una explicación más larga de cada paso (página "Cómo funciona").
import { useIdioma } from '../../context/IdiomaContext.jsx'
import Icono from '../Icono.jsx'

export const PASOS = [
  { icono: 'camara', titulo: 'El robot recorre', texto: 'Una cámara en el robot filma cada zona de la planta mientras recorre su ruta.',
    detalle: 'El robot, con orugas y un ESP32-S3, sigue con sus sensores una cinta en el piso o las líneas que la fábrica ya tiene pintadas, recorre la ruta que arma el encargado en la web y espera unos segundos en cada zona. Se puede iniciar, pausar o frenar en emergencia desde el celular.' },
  { icono: 'ia', titulo: 'La IA detecta', texto: 'YOLO revisa que tengan casco, guantes, lentes y chaleco, y reconoce de quién es la cara.',
    detalle: 'Un servidor con inteligencia artificial analiza el video. Si a alguien le falta el casco, los guantes, los lentes o el chaleco durante varios cuadros seguidos, lo marca y busca su cara entre los empleados que dieron su consentimiento.' },
  { icono: 'alerta', titulo: 'Llega la alerta', texto: 'El encargado la ve al instante, con la foto, la zona y la confianza de la IA.',
    detalle: 'La alerta aparece en el panel con la foto del momento. El encargado la revisa y la marca como resuelta; todo queda registrado en el historial y en la auditoría.' },
  { icono: 'campana', titulo: 'El robot da la alarma', texto: 'Se detiene en la zona, muestra el signo de peligro y hace sonar la alarma.',
    detalle: 'La persona se entera en el momento, sin que nadie tenga que ir a buscarla. Después de unos segundos el robot sigue solo con su recorrido. Las máquinas de la fábrica no se tocan: el resto de la planta sigue trabajando.' },
]

export default function Pasos({ detalle = false }) {
  const { t } = useIdioma()
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PASOS.map((p, i) => (
        <li key={p.titulo} className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl bg-tinta text-marca shadow-[3px_3px_0_var(--color-marca)] dark:bg-zinc-800"><Icono nombre={p.icono} /></span>
            <span className="font-titulo text-4xl font-black text-marca italic tabular-nums" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          </div>
          <h3 className="mt-4 font-bold"><span className="sr-only">{t('Paso')} {i + 1}: </span>{t(p.titulo)}</h3>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{t(detalle ? p.detalle : p.texto)}</p>
        </li>
      ))}
    </ol>
  )
}
