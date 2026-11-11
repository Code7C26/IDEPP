// Colores y textos de los gráficos de Reportes.
// Cada gráfico muestra UNA sola serie, con el azul de datos: se validó que se vea bien (contraste y
// daltonismo) sobre el fondo de las tarjetas, en claro y en oscuro. No usamos rojo ni verde para los
// datos porque en la app esos colores significan estado (alerta / todo bien).
export const COLORES = {
  // texto: ejes y etiquetas · valor: los números junto a las barras (tinta de texto, nunca el color de la serie)
  claro: { serie: '#2a78d6', grilla: '#e4e4e7', eje: '#d4d4d8', texto: '#71717a', valor: '#3f3f46', cursor: 'rgba(24, 24, 27, 0.05)' },
  oscuro: { serie: '#3987e5', grilla: '#27272a', eje: '#3f3f46', texto: '#a1a1aa', valor: '#e4e4e7', cursor: 'rgba(255, 255, 255, 0.06)' },
}

// Cómo leer el cumplimiento: además del color, siempre va el texto (el color nunca está solo)
export function nivelCumplimiento(valor) {
  if (valor >= 90) return { texto: 'Bien', tono: 'ok', barra: 'bg-ok' }
  if (valor >= 75) return { texto: 'A mejorar', tono: 'naranja', barra: 'bg-naranja' }
  return { texto: 'Riesgo', tono: 'alerta', barra: 'bg-alerta' }
}

// 'AAAA-MM-DD' -> '05/10'. Se corta el texto en vez de usar new Date(), porque new Date('2026-10-05')
// es la medianoche en Londres y en Argentina mostraría el día anterior.
export function diaCorto(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

// 'AAAA-MM-DD' -> 'lunes 05/10'
export function diaLargo(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const nombre = new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', { weekday: 'long' })
  return `${nombre} ${diaCorto(iso)}`
}
