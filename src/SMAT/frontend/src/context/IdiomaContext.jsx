// Idioma de la web: español (es) o inglés (en). Se guarda en el navegador, igual que el tema.
// Uso:  const { idioma, cambiarIdioma, t } = useIdioma()
//       t('Ingresar')  -> 'Ingresar' en español, 'Log in' en inglés
// Las traducciones están en utils/textos.js. Si una frase no está traducida, se muestra en español.
import { createContext, useContext, useEffect, useState } from 'react'
import { INGLES } from '../utils/textos.js'
import { traducir, traducirDocumento } from '../utils/traductorPagina.js'

const IdiomaContext = createContext(null)

// Si nunca se eligió, arranca en español (nuestro público es argentino)
function idiomaInicial() {
  try {
    return localStorage.getItem('idioma') === 'en' ? 'en' : 'es'
  } catch {
    return 'es' // sin acceso a localStorage
  }
}

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(idiomaInicial)

  useEffect(() => {
    document.documentElement.lang = idioma === 'en' ? 'en' : 'es-AR' // ayuda a los lectores de pantalla
    try {
      localStorage.setItem('idioma', idioma)
    } catch {
      // no pasa nada si no se puede guardar
    }
  }, [idioma])

  // En inglés se traduce TODO lo que se ve, no solo lo que usa t() (utils/traductorPagina.js). Al volver al
  // español, la función que devuelve deja cada texto como estaba.
  // Los renders y el juego (iframes) usan la misma función para lo que dibujan en la escena (robot3d/embebido.js).
  useEffect(() => {
    if (idioma !== 'en') return undefined
    window.__traducirTexto = traducir
    const dejarDeTraducir = traducirDocumento(document)
    return () => {
      delete window.__traducirTexto
      dejarDeTraducir()
    }
  }, [idioma])

  const cambiarIdioma = () => setIdioma((actual) => (actual === 'es' ? 'en' : 'es'))
  const t = (frase) => (idioma === 'en' ? INGLES[frase] ?? frase : frase)

  return <IdiomaContext.Provider value={{ idioma, cambiarIdioma, t }}>{children}</IdiomaContext.Provider>
}

export function useIdioma() {
  return useContext(IdiomaContext)
}
