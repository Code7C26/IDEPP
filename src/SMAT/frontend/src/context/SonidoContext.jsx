// Sonido de alerta. Se arma con la Web Audio API del navegador (tres pitidos), sin archivos de audio.
// Uso:  const { activado, alternar, activar, sonar } = useSonido()
//
// Los navegadores NO dejan sonar una página hasta que la persona la toca (para que ninguna web
// haga ruido sola). Por eso:
//  - el sonido se activa con un botón (la campana del menú o "Activar sonido" del banner);
//  - la elección se guarda en el navegador, y al volver a entrar se habilita con el primer toque.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const SonidoContext = createContext(null)

let contexto = null   // el "parlante" de la página: uno solo para toda la app

// Crea (o despierta) el parlante. Devuelve true si ya puede sonar.
async function desbloquear() {
  const Audio = window.AudioContext || window.webkitAudioContext
  if (!Audio) return false   // navegador muy viejo: sin sonido
  if (!contexto) contexto = new Audio()
  if (contexto.state !== 'running') await contexto.resume().catch(() => {})
  return contexto.state === 'running'
}

// Tres pitidos cortos, agudo-grave-agudo, como una alarma suave
function tocarPitidos() {
  if (contexto?.state !== 'running') return
  const ahora = contexto.currentTime
  ;[0, 0.22, 0.44].forEach((inicio, i) => {
    const oscilador = contexto.createOscillator()
    const volumen = contexto.createGain()
    oscilador.type = 'square'
    oscilador.frequency.value = i === 1 ? 660 : 880
    volumen.gain.setValueAtTime(0.12, ahora + inicio)
    volumen.gain.exponentialRampToValueAtTime(0.001, ahora + inicio + 0.18)   // se apaga de a poco
    oscilador.connect(volumen).connect(contexto.destination)
    oscilador.start(ahora + inicio)
    oscilador.stop(ahora + inicio + 0.2)
  })
}

function leerPreferencia() {
  try { return localStorage.getItem('sonido') === 'si' } catch { return false }
}

function guardarPreferencia(activado) {
  try { localStorage.setItem('sonido', activado ? 'si' : 'no') } catch { /* sin acceso: no se recuerda */ }
}

export function SonidoProvider({ children }) {
  const [activado, setActivado] = useState(leerPreferencia)
  const [listo, setListo] = useState(false)   // true cuando el navegador ya deja sonar

  // Si estaba activado de antes, se habilita con el primer toque o tecla en la página
  useEffect(() => {
    if (!activado || listo) return undefined
    const habilitar = () => { desbloquear().then(setListo) }
    window.addEventListener('pointerdown', habilitar)
    window.addEventListener('keydown', habilitar)
    return () => {
      window.removeEventListener('pointerdown', habilitar)
      window.removeEventListener('keydown', habilitar)
    }
  }, [activado, listo])

  // Activar siempre se llama desde un clic, así que el navegador deja sonar. Suena una vez de prueba.
  const activar = useCallback(async () => {
    setActivado(true)
    guardarPreferencia(true)
    const puede = await desbloquear()
    setListo(puede)
    tocarPitidos()
  }, [])

  const alternar = useCallback(() => {
    if (activado) {
      setActivado(false)
      guardarPreferencia(false)
    } else {
      activar()
    }
  }, [activado, activar])

  // La llama AlertaSonora cuando llega una alerta nueva
  const sonar = useCallback(() => {
    if (activado) tocarPitidos()
  }, [activado])

  return (
    <SonidoContext.Provider value={{ activado, listo, activar, alternar, sonar }}>
      {children}
    </SonidoContext.Provider>
  )
}

export function useSonido() {
  return useContext(SonidoContext)
}
