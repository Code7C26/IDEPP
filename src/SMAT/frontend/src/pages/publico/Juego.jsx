// El juego "Patrulla DROID-E3D": el archivo original, hecho en Claude (public/robot3d/patrulla.html).
import { EncabezadoPagina } from '../../components/publico/Bloques.jsx'
import RenderEmbebido from '../../components/RenderEmbebido.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

export default function Juego() {
  useTituloPagina('Juego', 'Patrulla DROID-E3D: manejá el robot por la fábrica y encontrá a quien se sacó el casco antes de que sea tarde.')

  return (
    <>
      <EncabezadoPagina antetitulo="Juego" titulo="Manejá el robot por la fábrica">
        Recorré la planta y encontrá a quien se sacó el casco antes de que sea tarde.
      </EncabezadoPagina>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <RenderEmbebido archivo="patrulla" titulo="Juego Patrulla DROID-E3D" />
      </div>
    </>
  )
}
