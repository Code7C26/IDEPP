// El render del robot en las páginas públicas: igual al de "Robot SMAT 3D", con sus botones y sus piezas.
// Es un modelo: no llama al backend ni muestra nada del robot real.
import { useState } from 'react'
import Escenario, { BotonesVista, botonRobotAlerta, useVista } from '../robot3d/Escenario.jsx'

const PIEZAS = [
  { color: '#f2b705', nombre: 'Chasis DROID-E3D', detalle: 'Cuerpo impreso en 3D, estilo Wall-E' },
  { color: '#2a2d2a', nombre: 'Orugas + 2 motores N20', detalle: 'Movidos por el driver DRV8833' },
  { color: '#3a6df0', nombre: 'Pantalla TFT IPS 1.3" 240x240', detalle: 'Muestra el aviso a color' },
  { color: '#1b3a6b', nombre: 'ESP32 (adentro)', detalle: 'Recibe la alerta por WiFi y frena' },
  { color: '#9aa09a', nombre: 'Cámara en los ojos', detalle: 'Filma a los trabajadores y manda el video por WiFi' },
  { color: '#d7262b', nombre: 'Luz de alerta y buzzer', detalle: 'Se prenden cuando falta el casco · GPIO 4' },
]

export default function RobotSimulado() {
  const vista = useVista()
  const [alerta, setAlerta] = useState(false)
  const estado = { pantalla: alerta ? 'sin_casco' : 'ok', alerta, orugas: !alerta, apagado: false }

  return (
    <figure className="grid gap-4 min-[861px]:grid-cols-[minmax(0,1fr)_300px]">
      <Escenario estado={estado} tono={alerta ? 'alerta' : 'ok'} vista={vista}
                 texto={alerta ? 'Alerta · sin casco · detenido' : 'Patrullando · casco OK'} />
      <figcaption className="grid min-w-0 content-start gap-3.5 font-robot">
        <div className="grid gap-2">
          <button type="button" className={botonRobotAlerta} onClick={() => setAlerta((a) => !a)}>
            {alerta ? 'Volver a patrullar' : 'Simular trabajador sin casco'}
          </button>
          <BotonesVista vista={vista} />
        </div>
        <div className="border-t border-[#d5d9cf] pt-3 dark:border-[#343a33]">
          <h3 className="mb-2 text-xs font-semibold tracking-widest text-[#5d6459] uppercase dark:text-[#a2a99c]">Piezas</h3>
          <ul className="grid gap-2">
            {PIEZAS.map((p) => (
              <li key={p.nombre} className="grid grid-cols-[14px_1fr] items-baseline gap-2.5 text-[15px]">
                <span aria-hidden="true" className="size-3 translate-y-px border border-[#d5d9cf] dark:border-[#343a33]" style={{ backgroundColor: p.color }} />
                <div><b className="font-semibold">{p.nombre}</b><small className="block text-[13px] text-[#5d6459] dark:text-[#a2a99c]">{p.detalle}</small></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-[#5d6459] dark:text-[#a2a99c]">Modelo 3D: no muestra datos de un robot real.</p>
      </figcaption>
    </figure>
  )
}
