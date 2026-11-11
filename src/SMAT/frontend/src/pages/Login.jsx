import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/client.js'
import Campo from '../components/Campo.jsx'
import Icono from '../components/Icono.jsx'
import Logo from '../components/Logo.jsx'
import { inicioSegunRol, useAuth } from '../context/AuthContext.jsx'
import { useTema } from '../context/TemaContext.jsx'
import useValidacion from '../hooks/useValidacion.js'
import { botonPrimario, campo, mensajeError } from '../utils/estilos.js'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const { oscuro, cambiarTema } = useTema()
  const navegar = useNavigate()
  const { state } = useLocation() // state.desde = la página que quería ver antes de loguearse

  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  // Al salir de un campo vacío no se marca error (si no, al tocar un enlace aparece el error y el enlace se corre);
  // los campos vacíos se avisan al intentar ingresar.
  const { error: errorDe, tocar, puedeEnviar } = useValidacion({
    usuario: usuario.trim() ? '' : 'Escribí tu usuario.',
    contrasena: contrasena ? '' : 'Escribí tu contraseña.',
  })

  const enviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar()) return
    setError('')
    setCargando(true)
    try {
      const datos = await loginUser(usuario.trim(), contrasena)
      iniciarSesion(datos)
      navegar(state?.desde || inicioSegunRol(datos), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top,rgba(245,184,0,0.10),transparent_45%)] p-4">
      <button type="button" onClick={cambiarTema} aria-label="Cambiar tema"
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800">
        <Icono nombre={oscuro ? 'sol' : 'luna'} />
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo conTexto={false} className="size-12" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ingresá a DROID-E3D</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Control de elementos de protección personal</p>
          </div>
        </div>

        <form onSubmit={enviar} noValidate
              className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Campo etiqueta="Usuario" error={errorDe('usuario')}>
            <input className={campo} value={usuario} autoComplete="username" autoFocus
                   onChange={(e) => setUsuario(e.target.value)} onBlur={usuario ? tocar('usuario') : undefined} />
          </Campo>
          <Campo etiqueta="Contraseña" error={errorDe('contrasena')}>
            <input className={campo} type="password" value={contrasena} autoComplete="current-password"
                   onChange={(e) => setContrasena(e.target.value)} onBlur={contrasena ? tocar('contrasena') : undefined} />
          </Campo>

          {error && <p role="alert" className={mensajeError}>{error}</p>}

          <button type="submit" disabled={cargando} className={`${botonPrimario} w-full py-2.5`}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Link to="/" className="font-medium hover:text-zinc-900 hover:underline dark:hover:text-white">← Conocé DROID-E3D</Link>
          <span className="mx-2">·</span>DROID-E3D by SMAT · una división de TOUCH
        </p>
      </div>
    </div>
  )
}
