// Pone el título de la pestaña y la descripción que muestran Google y WhatsApp al compartir.
// Uso: useTituloPagina('Planes', 'Precios del robot y del abono mensual.')
import { useEffect } from 'react'

const MARCA = 'DROID-E3D by SMAT'

export default function useTituloPagina(titulo, descripcion) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${MARCA}` : `${MARCA} · Seguridad que recorre la planta`
    if (descripcion) document.querySelector('meta[name="description"]')?.setAttribute('content', descripcion)
  }, [titulo, descripcion])
}
