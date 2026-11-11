// Sesión del usuario disponible en toda la app: quién es, iniciar sesión y cerrarla.
// Uso en cualquier componente:  const { usuario, cerrarSesion } = useAuth()
import { createContext, useContext, useEffect, useState } from 'react'
import { olvidarEsteDispositivo } from '../hooks/useNotificaciones.js'

const AuthContext = createContext(null)

// Lee la sesión guardada en el navegador (si el JSON está roto, se ignora)
function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion)

  // datos = lo que devuelve POST /api/login (incluye el token)
  const iniciarSesion = (datos) => {
    localStorage.setItem('user', JSON.stringify(datos))
    setUsuario(datos)
  }

  const cerrarSesion = () => {
    olvidarEsteDispositivo().catch(() => {})   // deja de recibir notificaciones de esta persona
    localStorage.removeItem('user')
    setUsuario(null)
  }

  // api/client.js avisa con este evento cuando el backend responde 401 (token vencido)
  useEffect(() => {
    const alVencer = () => setUsuario(null)
    window.addEventListener('sesion-vencida', alVencer)
    return () => window.removeEventListener('sesion-vencida', alVencer)
  }, [])

  const valor = {
    usuario,
    esEncargado: usuario?.rol === 'encargado',
    iniciarSesion,
    cerrarSesion,
  }
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// Ruta de inicio según el rol (a dónde ir después del login)
export function inicioSegunRol(usuario) {
  return usuario?.rol === 'encargado' ? '/app/panel' : '/app'
}
