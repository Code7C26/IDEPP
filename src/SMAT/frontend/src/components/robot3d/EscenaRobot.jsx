// Une la escena 3D con React. Este archivo y Three.js se descargan solo en las páginas que muestran el
// render (lo carga Escenario con lazy).
// Props: estado (ver ponerEstado en escena.js), girando (giro automático), vistaFrente (un número: cada
// vez que cambia, la cámara va al frente del robot) y onFallo (no se pudo dibujar).
import { useEffect, useRef } from 'react'
import { crearEscena } from './escena.js'

// El logo y la pantallita se dibujan una sola vez: las tipografías tienen que estar cargadas antes
const TIPOGRAFIAS = ['400 96px "Archivo Black"', '700 34px "IBM Plex Sans"']
const MAXIMO_MS = 1500     // si tardan más, sigue con la tipografía de repuesto

function esperarTipografias() {
  const cargadas = Promise.all(TIPOGRAFIAS.map((t) => document.fonts.load(t))).catch(() => {})
  return Promise.race([cargadas, new Promise((listo) => { setTimeout(listo, MAXIMO_MS) })])
}

export default function EscenaRobot({ estado, girando, vistaFrente, onFallo }) {
  const contenedor = useRef(null)
  const escena = useRef(null)
  // Lo último que llegó, para aplicarlo cuando la escena termine de crearse
  const actual = useRef({})
  actual.current = { estado, girando }

  useEffect(() => {
    let cancelado = false
    esperarTipografias().then(() => {
      if (cancelado) return
      try {
        escena.current = crearEscena(contenedor.current)
        escena.current.ponerEstado(actual.current.estado)
        escena.current.girar(actual.current.girando)
      } catch {
        onFallo()     // sin WebGL
      }
    })
    return () => {
      cancelado = true
      escena.current?.destruir()
      escena.current = null
    }
    // La escena se crea una sola vez: el estado se le pasa abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const claveEstado = JSON.stringify(estado)
  useEffect(() => { escena.current?.ponerEstado(estado) }, [claveEstado])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { escena.current?.girar(girando) }, [girando])
  useEffect(() => { if (vistaFrente) escena.current?.verDeFrente() }, [vistaFrente])

  return <div ref={contenedor} className="size-full" aria-hidden="true" />
}
