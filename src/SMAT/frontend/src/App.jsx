// Mapa de rutas de la web (ver docs/PLAN.md, "Mapa del sitio").
//  /, /como-funciona, /planes, /nosotros, /contacto -> página pública de SMAT (sin login)
//  /login      -> pública
//  /app/...    -> con sesión; algunas solo para empleado y otras solo para encargado
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import LayoutPublico from './components/publico/LayoutPublico.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import { inicioSegunRol, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import Inicio from './pages/empleado/Inicio.jsx'
import MisAlertas from './pages/empleado/MisAlertas.jsx'
import Perfil from './pages/empleado/Perfil.jsx'
import Auditoria from './pages/encargado/Auditoria.jsx'
import Empleados from './pages/encargado/Empleados.jsx'
import Incidencias from './pages/encargado/Incidencias.jsx'
import Panel from './pages/encargado/Panel.jsx'
import Robot from './pages/encargado/Robot.jsx'
import Zonas from './pages/encargado/Zonas.jsx'
import ComoFunciona from './pages/publico/ComoFunciona.jsx'
import Contacto from './pages/publico/Contacto.jsx'
import InicioPublico from './pages/publico/InicioPublico.jsx'
import Juego from './pages/publico/Juego.jsx'
import Nosotros from './pages/publico/Nosotros.jsx'
import Planes from './pages/publico/Planes.jsx'

// Reportes trae la librería de gráficos (recharts): se descarga recién cuando el encargado entra ahí,
// así el resto de la app (por ejemplo, la del empleado en el celular) carga más rápido.
const Reportes = lazy(() => import('./pages/encargado/Reportes.jsx'))

// /app muestra el Inicio del empleado; al encargado lo lleva a su Panel
function InicioApp() {
  const { usuario } = useAuth()
  return usuario.rol === 'encargado' ? <Navigate to="/app/panel" replace /> : <Inicio />
}

export default function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route index element={<InicioPublico />} />
        <Route path="como-funciona" element={<ComoFunciona />} />
        <Route path="juego" element={<Juego />} />
        <Route path="planes" element={<Planes />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="contacto" element={<Contacto />} />
      </Route>
      <Route path="/login" element={usuario ? <Navigate to={inicioSegunRol(usuario)} replace /> : <Login />} />

      <Route path="/app" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<InicioApp />} />

        <Route element={<RutaProtegida roles={['empleado']} />}>
          <Route path="mis-alertas" element={<MisAlertas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        <Route element={<RutaProtegida roles={['encargado']} />}>
          <Route path="panel" element={<Panel />} />
          <Route path="incidencias" element={<Incidencias />} />
          <Route path="empleados" element={<Empleados />} />
          <Route path="zonas" element={<Zonas />} />
          <Route path="robot" element={<Robot />} />
          <Route path="reportes" element={<Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}><Reportes /></Suspense>} />
          <Route path="auditoria" element={<Auditoria />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}
