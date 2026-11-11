// Marco de todas las páginas con sesión.
//  - PC / tablet: barra lateral fija a la izquierda y el contenido a la derecha
//  - celular: barra arriba y menú abajo
// <Outlet /> es donde React Router dibuja la página actual.
import { Outlet } from 'react-router-dom'
import AlertaSonora from './AlertaSonora.jsx'
import BarraLateral from './BarraLateral.jsx'
import BarraMovil from './BarraMovil.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-dvh">
      <BarraLateral />
      <div className="min-w-0 flex-1">
        <BarraMovil />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AlertaSonora />
    </div>
  )
}
