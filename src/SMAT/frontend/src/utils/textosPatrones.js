// Reglas para traducir al inglés los textos que cambian: cantidades, fechas, «hace 3 días» o nombres adentro de
// una frase. Cada regla es [expresión, (partes, traducir) => texto en inglés]; «traducir» pasa al inglés un pedazo
// (ej. el tipo de falta en «Ver detalle: Sin casco») o lo deja igual si no lo conoce.
// Las usa utils/traductorPagina.js cuando la frase no está tal cual en el diccionario (utils/textos.js).

const DIAS = { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', jueves: 'Thursday', viernes: 'Friday',
  'sábado': 'Saturday', domingo: 'Sunday' }
const MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June',
  julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' }
const plural = (n, uno, varios) => (Number(n) === 1 ? uno : varios)

export const PATRONES = [
  // Tiempo
  [/^hace (\d+) min$/, (p) => `${p[1]} min ago`],
  [/^hace (\d+) h$/, (p) => `${p[1]} h ago`],
  [/^hace (\d+) días?$/, (p) => `${p[1]} ${plural(p[1], 'day', 'days')} ago`],
  [/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo) (\d\d\/\d\d)$/, (p) => `${DIAS[p[1]]} ${p[2]}`],
  [/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})$/, (p) => `${MESES[p[1]]} ${p[2]}`],
  [/^en (\d+) días$/, (p) => `in ${p[1]} days`],
  [/^últimos (\d+) días$/, (p) => `last ${p[1]} days`],

  // Cantidades
  [/^(\d+) alertas?$/, (p) => `${p[1]} ${plural(p[1], 'alert', 'alerts')}`],
  [/^(\d+) en total$/, (p) => `${p[1]} in total`],
  [/^(\d+) de (\d+) personas$/, (p) => `${p[1]} of ${p[2]} people`],
  [/^(\d+) zonas? en la fábrica$/, (p) => `${p[1]} ${plural(p[1], 'area', 'areas')} in the factory`],
  [/^(\d+) de (\d+)$/, (p) => `${p[1]} of ${p[2]}`],
  [/^de (\d+) zonas$/, (p) => `of ${p[1]} areas`],
  [/^(\d+) más que (.+)$/, (p, t) => `${p[1]} more than ${t(p[2])}`],
  [/^igual que (.+)$/, (p, t) => `same as ${t(p[1])}`],
  [/^(\d+)% vs (.+)$/, (p, t) => `${p[1]}% vs ${t(p[2])}`],
  [/^Alertas por día: (\d+) de (\d+) días tuvieron alertas$/, (p) => `Alerts per day: ${p[1]} of ${p[2]} days had alerts`],
  [/^· (\d+) alertas? sin persona identificada no cuentan? para nadie$/,
    (p) => `· ${p[1]} ${plural(p[1], 'alert', 'alerts')} with no identified person ${plural(p[1], 'does', 'do')} not count for anyone`],
  [/^Quién hizo qué y cuándo · (\d+) registros?$/, (p) => `Who did what and when · ${p[1]} ${plural(p[1], 'record', 'records')}`],
  [/^Hoy: (.+)$/, (p) => `Today: ${p[1]}`],
  [/^Últimos 7 días: (.+)$/, (p) => `Last 7 days: ${p[1]}`],
  [/^Tenés (\d+) alertas? activas?\. Revisá tu equipo de protección\.$/,
    (p) => `You have ${p[1]} open ${plural(p[1], 'alert', 'alerts')}. Check your protective equipment.`],

  // Zonas y robot
  [/^Zona ([A-Z])$/, (p) => `Zone ${p[1]}`],
  [/^(.+): Todo en orden$/, (p, t) => `${t(p[1])}: All good`],
  [/^(.+): (\d+) alerta\(s\) activa\(s\)$/, (p, t) => `${t(p[1])}: ${p[2]} open alert(s)`],
  [/^Parada (\d+) del robot$/, (p) => `Robot stop ${p[1]}`],
  [/^Segundos de espera en (.+)$/, (p, t) => `Seconds to wait in ${t(p[1])}`],
  [/^Quitar (.+)$/, (p, t) => `Remove ${t(p[1])}`],
  [/^Sin resolver · la más vieja, (.+)$/, (p, t) => `Unresolved · the oldest, ${t(p[1])}`],
  [/^Sin conexión · último dato (.+?) en (.+)$/, (p, t) => `Offline · last data ${t(p[1])} in ${t(p[2])}`],
  [/^Sin conexión · último dato (.+)$/, (p, t) => `Offline · last data ${t(p[1])}`],
  [/^En (.+) · (.+)$/, (p, t) => `In ${t(p[1])} · ${t(p[2])}`],
  [/^(.+) · sin zona informada$/, (p, t) => `${t(p[1])} · no area reported`],
  [/^· Batería (\d+)% · Zona: (.+)$/, (p, t) => `· Battery ${p[1]}% · Area: ${t(p[2])}`],
  [/^· Última batería (\d+)% · Última zona: (.+)$/, (p, t) => `· Last battery ${p[1]}% · Last area: ${t(p[2])}`],
  [/^Último dato (.+) \((.+)\)$/, (p, t) => `Last data ${t(p[1])} (${t(p[2])})`],
  [/^Comando '(.+)'$/, (p, t) => `Command '${t(p[1])}'`],
  [/^Se superpone con (.+)\. Cambiá el lugar o el tamaño\.$/,
    (p, t) => `It overlaps ${p[1].split(', ').map(t).join(', ')}. Change its position or size.`],

  // Personas
  [/^Hola, (.+)$/, (p) => `Hello, ${p[1]}`],
  [/^Editar a (.+)$/, (p) => `Edit ${p[1]}`],
  [/^Editar (.+)$/, (p, t) => `Edit ${t(p[1])}`],
  [/^Dar de baja a (.+)$/, (p) => `Deactivate ${p[1]}`],
  [/^(.+) quedó de baja$/, (p) => `${p[1]} was deactivated`],
  [/^Marcar la alerta de (.+) en (.+)$/, (p, t) => `Select the alert for ${t(p[1])} in ${t(p[2])}`],
  [/^Ver detalle: (.+)$/, (p, t) => `See details: ${t(p[1])}`],
  [/^Evidencia: (.+)$/, (p, t) => `Evidence: ${t(p[1])}`],
  [/^Resolver (\d+) alertas?$/, (p) => `Resolve ${p[1]} ${plural(p[1], 'alert', 'alerts')}`],

  // Listas («Casco, Lentes» o «Chaleco: 18, Lentes: 13»)
  [/^EPP: (.+)$/, (p, t) => `PPE: ${p[1].split(', ').map(t).join(', ')}`],
  [/^((?:[^,:]+: \d+, )+[^,:]+: \d+)$/, (p, t) => p[1].split(', ').map((x) => {
    const [nombre, cantidad] = x.split(': ')
    return `${t(nombre)}: ${cantidad}`
  }).join(', ')],
  [/^(.+):$/, (p, t) => `${t(p[1])}:`],
  [/^· (.+)$/, (p, t) => `· ${t(p[1])}`],

  // Fotos y archivos
  [/^La foto supera los (\d+) MB\.$/, (p) => `The photo is larger than ${p[1]} MB.`],
  [/^Ya tiene (\d+) fotos: borrá una para subir otra$/, (p) => `They already have ${p[1]} photos: delete one to upload another`],
  [/^Error (\d+) en el servidor$/, (p) => `Server error ${p[1]}`],

  // Títulos de la pestaña: «Planes · DROID-E3D by IDEPP»
  [/^(.+) · DROID-E3D by IDEPP$/, (p, t) => `${t(p[1])} · DROID-E3D by IDEPP`],
  // Renders 3D y juego
  [/^Faltas hoy: (\d+)$/, (p) => `Violations today: ${p[1]}`],
  [/^ALERTA: (.+)$/, (p) => `ALERT: ${p[1]}`],
  [/^⚠ Sin (casco|chaleco|lentes) · (.+)$/, (p, t) => `⚠ No ${t(p[1])} · ${t(p[2])}`],
  [/^⚠ ¡Rápido! Sin (casco|chaleco|lentes) · (\d+) s$/, (p, t) => `⚠ Hurry! No ${t(p[1])} · ${p[2]} s`],
  [/^✔ Casco OK · (.+)$/, (p) => `✔ Helmet OK · ${p[1]}`],
  [/^✖ SIN CASCO · (.+)$/, (p) => `✖ NO HELMET · ${p[1]}`],
  [/^✔ Corregido · (.+)$/, (p) => `✔ Fixed · ${p[1]}`],
  [/^Alerta · (.+) sin casco$/, (p) => `Alert · ${p[1]} without a helmet`],
  [/^(.+) se pone el casco$/, (p) => `${p[1]} puts the helmet on`],
  [/^Escaneando a (.+) · (.+)$/, (p, t) => `Scanning ${p[1]} · ${t(p[2])}`],
  [/^¡Detectado: sin (casco|chaleco|lentes)! \+(\d+)$/, (p, t) => `Caught: no ${t(p[1])}! +${p[2]}`],
  [/^¡Racha de (\d+)! ×(\S+) \+(\d+)$/, (p) => `Streak of ${p[1]}! ×${p[2].replace(',', '.')} +${p[3]}`],
  [/^¡Se te pasó (.+)!$/, (p) => `You missed ${p[1]}!`],
  [/^(CLÁSICO|CONTRARRELOJ|SUPERVIVENCIA|PRÁCTICA) · (FÁCIL|NORMAL|DIFÍCIL)$/, (p) => {
    const modos = { 'CLÁSICO': 'CLASSIC', CONTRARRELOJ: 'TIME TRIAL', SUPERVIVENCIA: 'SURVIVAL', 'PRÁCTICA': 'PRACTICE' }
    const niveles = { 'FÁCIL': 'EASY', NORMAL: 'NORMAL', 'DIFÍCIL': 'HARD' }
    return `${modos[p[1]]} · ${niveles[p[2]]}`
  }],
  [/^Tu récord en (.+) · (.+): (\d+) puntos\.$/, (p, t) => `Your best in ${t(p[1])} · ${t(p[2])}: ${p[3]} points.`],
  [/^Todavía no jugaste en (.+) · (.+)\.$/, (p, t) => `You have not played ${t(p[1])} · ${t(p[2])} yet.`],
  [/^🏆 ¡Primer puesto en (.+) · (.+)!$/, (p, t) => `🏆 First place in ${t(p[1])} · ${t(p[2])}!`],
  [/^Quedaste (\d+)\.º en el ranking de (.+) · (.+)\.$/, (p, t) => `You came #${p[1]} in the ${t(p[2])} · ${t(p[3])} ranking.`],
  [/^No alcanzó para el top 10 de (.+) · (.+)\.$/, (p, t) => `Not enough for the ${t(p[1])} · ${t(p[2])} top 10.`],
  [/^¡Nuevo récord personal! \(antes: (\d+)\)$/, (p) => `New personal best! (before: ${p[1]})`],
  [/^Tu récord: (\d+)\.$/, (p) => `Your best: ${p[1]}.`],
  [/^Corregiste (\d+) faltas?, se te pas(?:ó|aron) (\d+) y tuviste (\d+) falsas? alarmas?\.$/,
    (p) => `You fixed ${p[1]} ${plural(p[1], 'violation', 'violations')}, missed ${p[2]} and had ${p[3]} false ${plural(p[3], 'alarm', 'alarms')}.`],
  [/^Mejor racha: (\d+) seguidas\.$/, (p) => `Best streak: ${p[1]} in a row.`],
  [/^Aguantaste (\d+) segundos\.$/, (p) => `You lasted ${p[1]} seconds.`],
  [/^Estuviste (\d+) s fuera de la ruta\.$/, (p) => `You spent ${p[1]} s off the route.`],
  [/^Rango: (.+)\.$/, (p, t) => `Rank: ${t(p[1])}.`],
]
