// Descargas de Reportes: las alertas del período en una planilla (CSV, para Excel) y el informe mensual
// en PDF (para la ART y las inspecciones). Las dos quedan registradas en la auditoría.
import { useState } from 'react'
import { descargarCSV, descargarInformePDF } from '../../api/client.js'
import { useAvisos } from '../../context/AvisosContext.jsx'
import { botonPrimario, botonSecundario, campo } from '../../utils/estilos.js'
import Icono from '../Icono.jsx'

// Los últimos 12 meses: [{ valor: '2026-10', texto: 'octubre de 2026' }, ...]
function ultimosMeses() {
  const hoy = new Date()
  return Array.from({ length: 12 }, (_, atras) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1)
    return { valor: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
             texto: fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) }
  })
}
const MESES = ultimosMeses()

export default function Descargas({ periodo }) {
  const avisar = useAvisos()
  const [mes, setMes] = useState(MESES[0].valor)
  const [bajando, setBajando] = useState('')   // 'csv', 'pdf' o '' (ninguna)

  const bajar = async (tipo, accion, mensaje) => {
    setBajando(tipo)
    try {
      await accion()
      avisar(mensaje)
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setBajando('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={botonSecundario} disabled={Boolean(bajando)}
              onClick={() => bajar('csv', () => descargarCSV(periodo), 'Planilla descargada')}>
        <Icono nombre="descargar" className="size-4" />{bajando === 'csv' ? 'Descargando…' : 'Planilla (CSV)'}
      </button>
      <div className="flex items-center gap-1.5">
        <select aria-label="Mes del informe" className={`${campo} w-auto py-1.5`} value={mes} onChange={(e) => setMes(e.target.value)}>
          {MESES.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
        </select>
        <button type="button" className={botonPrimario} disabled={Boolean(bajando)}
                onClick={() => bajar('pdf', () => descargarInformePDF(mes), 'Informe descargado')}>
          <Icono nombre="documento" className="size-4" />{/* "del mes": es de un mes entero, no sigue al período elegido en la pantalla */}
          {bajando === 'pdf' ? 'Generando…' : 'Informe PDF del mes'}
        </button>
      </div>
    </div>
  )
}
