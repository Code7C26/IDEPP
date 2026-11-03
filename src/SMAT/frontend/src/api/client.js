// Cliente de la API: TODAS las llamadas al backend de Flask pasan por este archivo.
// (Regla del proyecto: ningún componente usa fetch directamente.)

// URL del backend. En "npm run dev" sale de frontend/.env (en el celular, con la IP de la PC).
// En la versión compilada es "/api" (frontend/.env.production): la web y la API están en el mismo Flask.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Devuelve el token de la sesión guardada al hacer login, o undefined si no hay sesión.
function getToken() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.token
}

// Convierte { zona: 'Zona A', estado: 'activa' } en '?zona=Zona%20A&estado=activa'.
// Ignora los valores vacíos para no mandar filtros que no se usan.
function armarConsulta(filtros = {}) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.append(clave, valor)
  })
  const texto = params.toString()
  return texto ? `?${texto}` : ''
}

// Hace la llamada al backend y devuelve el JSON.
// Si algo sale mal lanza un Error con un mensaje en español, listo para mostrar en pantalla.
async function request(path, options = {}) {
  // Con FormData (fotos) el navegador arma solo el Content-Type multipart; con el resto mandamos JSON
  const esArchivo = options.body instanceof FormData
  const headers = { ...(esArchivo ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}` // sin sesión (login) no se manda

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    // fetch falla cuando no hay conexión o el backend está apagado
    throw new Error('No se pudo conectar con el servidor')
  }

  // Si la respuesta no es JSON (por ejemplo una página de error), seguimos con un objeto vacío
  const data = await res.json().catch(() => ({}))

  // 401 con sesión = el token venció o es inválido: se cierra la sesión y AuthContext lo detecta
  if (res.status === 401 && token) {
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('sesion-vencida'))
  }

  if (!res.ok) throw new Error(data.error || `Error ${res.status} en el servidor`)
  return data
}

// ---------- Sesión ----------

export const loginUser = (usuario, contrasena) =>
  request('/login', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) })

// Datos del usuario con sesión, con su zona completa (EPP, máquina). Sirve para el inicio y el perfil.
export const getMe = () => request('/me')

// ---------- Incidencias ----------

// Lista alertas. El empleado recibe solo las suyas; el encargado, todas.
// filtros (todos opcionales): { zona_id, estado, tipo, desde, hasta, page, limit }
// desde / hasta van como 'AAAA-MM-DD'.
export const getIncidents = (filtros) => request(`/incidents${armarConsulta(filtros)}`)

export const resolveIncident = (id) => request(`/incidents/${id}/resolver`, { method: 'PUT' })

// Resuelve varias de una vez. Devuelve { resueltas, omitidas }.
export const resolveIncidents = (ids) => request('/incidents/resolver-varias', { method: 'POST', body: JSON.stringify({ ids }) })

// Comentarios de una alerta (el encargado y el empleado detectado). texto: de 1 a 500 caracteres
export const getComentarios = (incidenciaId) => request(`/incidents/${incidenciaId}/comentarios`)
export const comentar = (incidenciaId, texto) =>
  request(`/incidents/${incidenciaId}/comentarios`, { method: 'POST', body: JSON.stringify({ texto }) })

// ---------- Estadísticas (solo encargado) ----------

export const getStats = () => request('/stats')

// ---------- Reportes (solo encargado) ----------

// periodo: { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD' }
// Alertas por día (con el detalle por tipo), por tipo, por zona, activas/resueltas y paradas de máquina
export const getReporteDiario = (periodo) => request(`/reports/diario${armarConsulta(periodo)}`)
// Cumplimiento de cada empleado y de cada zona (días sin alertas / días del período)
export const getRanking = (periodo) => request(`/reports/ranking${armarConsulta(periodo)}`)

// Descarga un archivo del backend (CSV o PDF). Como hace falta el token, no alcanza con un link común:
// se pide con fetch y después se "toca" un link invisible que guarda el archivo en la PC.
async function descargar(ruta, nombreArchivo) {
  let res
  try {
    res = await fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${getToken()}` } })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Error ${res.status} en el servidor`)
  }
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(await res.blob())
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)   // libera la memoria del archivo
}

// Las alertas del período en una planilla (se abre con Excel)
export const descargarCSV = (periodo) =>
  descargar(`/reports/incidencias.csv${armarConsulta(periodo)}`, `alertas_${periodo.desde}_a_${periodo.hasta}.csv`)
// Informe mensual en PDF (para la ART y las inspecciones). mes: 'AAAA-MM'
export const descargarInformePDF = (mes) => descargar(`/reports/mensual.pdf?mes=${mes}`, `informe-epp-${mes}.pdf`)

// ---------- Auditoría (solo encargado) ----------

// filtros (todos opcionales): { accion, usuario_id (un id o 'sistema'), desde, hasta, q, page, limit }
export const getAuditoria = (filtros) => request(`/auditoria${armarConsulta(filtros)}`)

// ---------- Zonas (leer: todos · crear, editar y borrar: encargado) ----------

export const getZones = () => request('/zones')
export const createZone = (datos) => request('/zones', { method: 'POST', body: JSON.stringify(datos) })
export const updateZone = (id, datos) => request(`/zones/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const deleteZone = (id) => request(`/zones/${id}`, { method: 'DELETE' })

// ---------- Empleados (solo encargado) ----------

// filtros opcionales: { rol, zona_id, activo: 'true' | 'false' }
export const getUsers = (filtros) => request(`/users${armarConsulta(filtros)}`)
export const createUser = (datos) => request('/users', { method: 'POST', body: JSON.stringify(datos) })
export const updateUser = (id, datos) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
// "Dar de baja" no borra al empleado (se perdería su historial): lo marca como inactivo
export const deactivateUser = (id) => request(`/users/${id}`, { method: 'DELETE' })

// ---------- Robot ----------

// Dónde está el robot: para cualquier usuario con sesión (solo zona, estado y conexión)
export const getRobotPosition = () => request('/robot/posicion')

// Lo que sigue es solo para el encargado

// Estado, batería, zona actual y si está conectado
export const getRobot = () => request('/robot/estado')

// comando: 'iniciar' | 'pausar' | 'detener' | 'emergencia'. El robot lo ejecuta en su próxima consulta (1-2 s).
export const sendRobotCommand = (comando) => request('/robot/comando', { method: 'POST', body: JSON.stringify({ comando }) })

export const getRobotRoute = () => request('/robot/ruta')
// ruta: lista [{ zona_id, tiempo_espera_seg }]; el orden de la lista es el orden del recorrido
export const saveRobotRoute = (ruta) => request('/robot/ruta', { method: 'PUT', body: JSON.stringify({ ruta }) })
// Dirección del video en vivo (la sirve la PC con la IA). Texto vacío = sin video.
export const saveRobotVideo = (url_video) => request('/robot/video', { method: 'PUT', body: JSON.stringify({ url_video }) })

// ---------- Máquinas (solo encargado) ----------

export const reactivateMachine = (zonaId) => request(`/zones/${zonaId}/reactivar`, { method: 'PUT' })
export const stopMachine = (zonaId) => request(`/zones/${zonaId}/detener`, { method: 'PUT' })

// ---------- Notificaciones push (cualquier usuario con sesión) ----------

// Clave pública del servidor: el navegador la necesita para suscribirse
export const getClavePush = () => request('/push/clave')
// suscripcion: lo que da el navegador con subscription.toJSON() -> { endpoint, keys: { p256dh, auth } }
export const suscribirPush = (suscripcion) => request('/push/suscribir', { method: 'POST', body: JSON.stringify(suscripcion) })
export const desuscribirPush = (endpoint) => request('/push/desuscribir', { method: 'POST', body: JSON.stringify({ endpoint }) })
// Manda una notificación de prueba a todos los dispositivos del usuario
export const probarPush = () => request('/push/probar', { method: 'POST' })

// ---------- Fotos (evidencias y rostros) ----------

// Las fotos no son públicas (muestran caras): se piden con el token y se convierten en una
// dirección local del navegador (blob:) que se puede poner en <img src>. Se guardan en memoria
// para no descargarlas de nuevo cada vez que se actualiza la pantalla.
const fotosEnMemoria = new Map()
export function getImagen(ruta) {
  if (!fotosEnMemoria.has(ruta)) {
    const pedido = fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar la foto')
        return res.blob()
      })
      .then((blob) => URL.createObjectURL(blob))
    pedido.catch(() => fotosEnMemoria.delete(ruta))   // si falló, la próxima vez se reintenta
    fotosEnMemoria.set(ruta, pedido)
  }
  return fotosEnMemoria.get(ruta)
}

// Fotos de rostro: las maneja el encargado o el mismo empleado. Solo se suben con consentimiento.
export const getRostros = (usuarioId) => request(`/users/${usuarioId}/rostros`)
export function uploadRostro(usuarioId, archivo) {
  const datos = new FormData()
  datos.append('imagen', archivo)
  datos.append('consentimiento', 'true')
  return request(`/users/${usuarioId}/rostros`, { method: 'POST', body: datos })
}
export const deleteRostro = (usuarioId, fotoId) => request(`/users/${usuarioId}/rostros/${fotoId}`, { method: 'DELETE' })
