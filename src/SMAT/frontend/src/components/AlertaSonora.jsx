// Avisa las alertas NUEVAS en cualquier página de la app: consulta cada 3 segundos, muestra un banner
// rojo arriba y suena (si el sonido está activado). En el celular, además, vibra.
//  - El encargado se entera de todas; el empleado, de las suyas (el backend ya filtra por rol).
//  - Las alertas que ya existían al entrar no se avisan: solo las que llegan después.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidents } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSonido } from '../context/SonidoContext.jsx'
import usePolling from '../hooks/usePolling.js'
import { nombreTipo } from '../utils/formato.js'
import Icono from './Icono.jsx'

const CADA_MS = 3000

export default function AlertaSonora() {
  const { usuario } = useAuth()
  const { activado, listo, activar, sonar } = useSonido()
  const navegar = useNavigate()
  const ultimoId = useRef(null)          // id más alto que ya vimos (null = todavía no consultamos)
  const [nuevas, setNuevas] = useState([])

  const { datos } = usePolling(() => getIncidents({ limit: 10 }), CADA_MS)

  useEffect(() => {
    const lista = datos?.incidencias
    if (!lista) return
    const mayor = Math.max(0, ...lista.map((i) => i.id))
    if (ultimoId.current === null) {     // primera consulta: solo anotamos dónde estamos
      ultimoId.current = mayor
      return
    }
    const recientes = lista.filter((i) => i.id > ultimoId.current && i.estado === 'activa')
    ultimoId.current = Math.max(ultimoId.current, mayor)
    if (recientes.length === 0) return
    setNuevas((anteriores) => [...recientes, ...anteriores].slice(0, 20))
    sonar()
    navigator.vibrate?.([300, 120, 300])
  }, [datos, sonar])

  if (nuevas.length === 0) return null

  const ultima = nuevas[0]
  const destino = usuario?.rol === 'encargado' ? '/app/incidencias' : '/app/mis-alertas'
  const cerrar = () => setNuevas([])
  const ver = () => { cerrar(); navegar(destino) }

  return (
    <div role="alert" className="animar-aviso fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-alerta px-4 py-3 text-white shadow-xl md:inset-x-6">
      <Icono nombre="alerta" className="size-6 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        <strong className="block">{nuevas.length === 1 ? 'Nueva alerta' : `${nuevas.length} alertas nuevas`}</strong>
        {nombreTipo(ultima.tipo)} en {ultima.zona}
        {usuario?.rol === 'encargado' && ` · ${ultima.empleado_nombre}`}
      </p>
      {/* En el celular los botones van en una segunda fila, para que el texto no quede apretado */}
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {/* El navegador bloquea el audio hasta que se toca la página: este botón lo habilita */}
        {(!activado || !listo) && (
          <button type="button" onClick={activar} className="rounded-lg border border-white/60 px-3 py-1.5 text-sm font-semibold hover:bg-white/15">
            Activar sonido
          </button>
        )}
        <button type="button" onClick={ver} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-alerta hover:bg-red-50">
          Ver
        </button>
        <button type="button" onClick={cerrar} aria-label="Cerrar aviso de alerta" className="grid size-8 place-items-center rounded-lg hover:bg-white/15">
          <Icono nombre="cerrar" className="size-4" />
        </button>
      </div>
    </div>
  )
}
