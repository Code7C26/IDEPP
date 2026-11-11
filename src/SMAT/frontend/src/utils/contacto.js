// Datos de contacto de SMAT para la página pública. Vienen del .env del frontend
// (VITE_CONTACTO_EMAIL y VITE_CONTACTO_WHATSAPP) porque no se publican en el repositorio.
export const EMAIL = import.meta.env.VITE_CONTACTO_EMAIL || ''
export const WHATSAPP = (import.meta.env.VITE_CONTACTO_WHATSAPP || '').replace(/\D/g, '')   // solo números

// Arma el mensaje del formulario de contacto en texto
export function armarMensaje({ nombre, empresa, mensaje }) {
  return `Hola, soy ${nombre}${empresa ? ` de ${empresa}` : ''}.\n\n${mensaje}`
}

export const enlaceMail = (datos) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(`Consulta por DROID-E3D${datos.empresa ? ` · ${datos.empresa}` : ''}`)}&body=${encodeURIComponent(armarMensaje(datos))}`

export const enlaceWhatsapp = (datos) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(armarMensaje(datos))}`
