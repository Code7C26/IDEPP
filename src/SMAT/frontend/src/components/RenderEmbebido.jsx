// Muestra uno de los renders o el juego de SMAT dentro de la página, en un iframe. Son los archivos originales
// hechos en Claude (public/robot3d): no se editan acá, se copian con backend/tools/copiar_renders.py.
// Props:
//   archivo      'robot' | 'fabrica' | 'patrulla'
//   titulo       para los lectores de pantalla
//   soloEscena   sin el título ni los paneles de abajo del archivo (opcional)
import { useEffect, useRef, useState } from 'react'
import { useTema } from '../context/TemaContext.jsx'
import { hayWebgl } from '../utils/robot3d.js'

export default function RenderEmbebido({ archivo, titulo, soloEscena = false }) {
  const marco = useRef(null)
  const [alto, setAlto] = useState(null)      // lo avisa el archivo (public/robot3d/embebido.js)
  const [con3d] = useState(hayWebgl)
  const { oscuro } = useTema()

  useEffect(() => {
    const recibir = (e) => {
      if (e.source === marco.current?.contentWindow && e.data?.robot3dAlto) setAlto(e.data.robot3dAlto)
    }
    window.addEventListener('message', recibir)
    return () => window.removeEventListener('message', recibir)
  }, [])

  // Los archivos ya saben dibujarse en claro y en oscuro: solo hay que decirles cuál
  const ponerTema = () => {
    const raiz = marco.current?.contentDocument?.documentElement
    if (raiz) raiz.dataset.theme = oscuro ? 'dark' : 'light'
  }
  useEffect(ponerTema, [oscuro])   // eslint-disable-line react-hooks/exhaustive-deps

  if (!con3d) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Este equipo no puede mostrar el modelo 3D del robot.</p>

  return (
    <iframe ref={marco} src={`/robot3d/${archivo}.html${soloEscena ? '?solo=escena' : ''}`} title={titulo} loading="lazy" onLoad={ponerTema}
            className={`block w-full border-0 ${alto ? '' : 'aspect-video'}`} style={alto ? { height: alto } : undefined} />
  )
}
