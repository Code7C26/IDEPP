// El juego "Patrulla DROID-E3D" (public/robot3d/patrulla.html). Nació en Claude y desde el 20/11/2026 se edita en la web:
// pide el nombre del jugador y guarda el ranking en el navegador.
import { EncabezadoPagina } from '../../components/publico/Bloques.jsx'
import RenderEmbebido from '../../components/RenderEmbebido.jsx'
import useTituloPagina from '../../hooks/useTituloPagina.js'

export default function Juego() {
  useTituloPagina('Juego', 'Patrulla DROID-E3D: manejá el robot por la fábrica, encontrá a quien trabaja sin su equipo de protección y entrá al ranking.')

  return (
    <>
      <EncabezadoPagina antetitulo="Juego" titulo="Manejá el robot por la fábrica">
        Recorré la planta y encontrá a quien le falta el casco, el chaleco o los lentes antes de que sea
        tarde. Cargá tu nombre y entrá al ranking.
      </EncabezadoPagina>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <RenderEmbebido archivo="patrulla" titulo="Juego Patrulla DROID-E3D" />
      </div>
    </>
  )
}
