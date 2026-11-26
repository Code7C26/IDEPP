// Muestra uno de los renders o el juego de DROID-E3D dentro de la página, en un iframe. Son los archivos hechos en
// Claude (public/robot3d): los renders se copian con backend/tools/copiar_renders.py; el juego se edita ahí mismo.
// Props:
//   archivo      'robot' | 'fabrica' | 'patrulla'
//   titulo       para los lectores de pantalla
//   soloEscena   sin el título ni los paneles de abajo del archivo (opcional)
//   aPedido      se carga recién al tocar un botón (opcional). El 3D comparte el hilo con la página: donde hay
//                controles que no pueden demorarse, como la parada de emergencia, no arranca solo
import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../context/IdiomaContext.jsx'
import { useTema } from '../context/TemaContext.jsx'
import { botonSecundario } from '../utils/estilos.js'
import { traducirDocumento } from '../utils/traductorPagina.js'
import { hayWebgl } from '../utils/robot3d.js'

export default function RenderEmbebido({ archivo, titulo, soloEscena = false, aPedido = false }) {
  const marco = useRef(null)
  const [alto, setAlto] = useState(null)      // lo avisa el archivo (public/robot3d/embebido.js)
  const [con3d] = useState(hayWebgl)
  const [abierto, setAbierto] = useState(!aPedido)
  const { oscuro } = useTema()
  const { idioma } = useIdioma()
  const dejarDeTraducir = useRef(null)

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

  // En inglés, el texto del render también se traduce. Al cambiar de idioma el iframe se vuelve a cargar (key),
  // así lo que dibuja en la escena sale en el idioma nuevo (robot3d/embebido.js)
  const alCargar = () => {
    ponerTema()
    const documento = marco.current?.contentDocument
    dejarDeTraducir.current = idioma === 'en' && documento ? traducirDocumento(documento) : null
  }
  useEffect(() => () => {
    try { dejarDeTraducir.current?.() } catch { /* el iframe ya no existe */ }
  }, [idioma])

  if (!con3d) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Este equipo no puede mostrar el modelo 3D del robot.</p>
  if (!abierto) return <button type="button" className={botonSecundario} onClick={() => setAbierto(true)}>Ver la simulación</button>

  return (
    <iframe key={idioma} ref={marco} src={`/robot3d/${archivo}.html${soloEscena ? '?solo=escena' : ''}`} title={titulo} loading="lazy" onLoad={alCargar}
            className={`block w-full border-0 ${alto ? '' : 'aspect-video'}`} style={alto ? { height: alto } : undefined} />
  )
}
