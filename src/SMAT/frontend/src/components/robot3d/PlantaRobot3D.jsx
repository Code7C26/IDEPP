// Une la escena 3D con React. Este archivo y Three.js se descargan solo en las páginas que lo usan
// (lo carga VistaRobot3D con lazy). Props: datos (ver actualizar() en escena.js) y onFallo.
import { useEffect, useRef } from 'react'
import { useTema } from '../../context/TemaContext.jsx'
import { crearEscena } from './escena.js'

export default function PlantaRobot3D({ datos, onFallo }) {
  const contenedor = useRef(null)
  const escena = useRef(null)
  const { oscuro } = useTema()

  useEffect(() => {
    try {
      escena.current = crearEscena(contenedor.current, { oscuro, onContextoPerdido: onFallo })
    } catch {
      onFallo()      // sin WebGL: VistaRobot3D muestra el mapa 2D
      return undefined
    }
    return () => { escena.current?.destruir(); escena.current = null }
    // La escena se crea una sola vez: el tema y los datos se le pasan abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { escena.current?.ponerTema(oscuro) }, [oscuro])
  useEffect(() => { escena.current?.actualizar(datos) })

  return <div ref={contenedor} className="size-full" aria-hidden="true" />
}
