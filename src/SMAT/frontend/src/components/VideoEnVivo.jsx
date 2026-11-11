// Video en vivo de la cámara del robot. La PC con la IA lo sirve como MJPEG (una imagen que se
// va renovando), y el navegador lo muestra con una simple etiqueta <img>.
//  - url: dirección del stream (ej. http://192.168.0.20:8080/video). Vacía = sin video configurado.
import { useEffect, useRef, useState } from 'react'
import { botonSecundario } from '../utils/estilos.js'

const ESPERA_MAXIMA_MS = 10000   // si en 10 segundos no llega ninguna imagen, se avisa que no hay señal

export default function VideoEnVivo({ url }) {
  const [estado, setEstado] = useState('conectando')   // 'conectando' · 'en_vivo' · 'falla'
  const [intento, setIntento] = useState(0)            // al cambiar, el navegador vuelve a pedir el video
  const imagen = useRef(null)

  // Una página https no puede mostrar video http (el navegador lo bloquea): se avisa en vez de quedar en negro
  const bloqueado = Boolean(url) && window.location.protocol === 'https:' && url.startsWith('http://')

  // Cada vez que cambia la dirección (o se reintenta) se espera la primera imagen.
  // Con MJPEG el evento onLoad no siempre llega (el video "nunca termina de cargar"), por eso se revisa
  // cada medio segundo si la imagen ya tiene tamaño. Si la cámara no contesta, el navegador puede tardar
  // más de 20 segundos en dar error: a los 10 segundos ya avisamos que no hay señal.
  useEffect(() => {
    setEstado('conectando')
    if (!url || bloqueado) return
    const inicio = Date.now()
    const revisar = setInterval(() => {
      if (imagen.current?.naturalWidth > 0) {
        setEstado('en_vivo')
        clearInterval(revisar)
      } else if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
        setEstado('falla')
        clearInterval(revisar)
      }
    }, 500)
    return () => clearInterval(revisar)
  }, [url, intento, bloqueado])

  let aviso = null
  if (!url) aviso = { titulo: 'Sin video configurado', texto: 'Indicá abajo la dirección del video que sirve la PC con la IA.' }
  else if (bloqueado) aviso = { titulo: 'El navegador bloquea este video', texto: 'La web usa https y el video usa http. Usá la web en la red local o un video https.' }
  else if (estado === 'falla') aviso = { titulo: 'Sin señal de video', texto: 'No llega imagen de la cámara. Revisá que esté encendida y en la misma red. Si es la app IP Webcam del celular, la dirección termina en /video.' }
  else if (estado === 'conectando') aviso = { titulo: 'Conectando con la cámara…', texto: 'Esperando la primera imagen.' }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
      {url && !bloqueado && (
        <img key={`${url}-${intento}`} ref={imagen} src={url} alt="Video en vivo de la cámara del robot"
             className={`size-full object-contain ${estado === 'falla' ? 'invisible' : ''}`}
             onError={() => setEstado('falla')} onLoad={() => setEstado('en_vivo')} />
      )}

      {aviso ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-zinc-300">
          <p className="font-semibold text-white">{aviso.titulo}</p>
          <p className="max-w-sm text-sm">{aviso.texto}</p>
          {estado === 'falla' && <button type="button" className={`${botonSecundario} mt-1 border-zinc-600 text-white hover:bg-zinc-800`} onClick={() => setIntento(intento + 1)}>Reintentar</button>}
        </div>
      ) : (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          <span className="size-2 animate-pulse rounded-full bg-alerta" /> EN VIVO
        </span>
      )}
    </div>
  )
}
