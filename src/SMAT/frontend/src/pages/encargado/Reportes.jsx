// Reportes del encargado: cuántas alertas hubo (por día, por equipo y por zona) y quién cumple mejor.
// El período se elige arriba; todo se recalcula en el backend (/api/reports/*).
import { useState } from 'react'
import { getRanking, getReporteDiario } from '../../api/client.js'
import Descargas from '../../components/reportes/Descargas.jsx'
import GraficoBarras from '../../components/reportes/GraficoBarras.jsx'
import GraficoPorDia from '../../components/reportes/GraficoPorDia.jsx'
import SelectorPeriodo, { periodoDeDias } from '../../components/reportes/SelectorPeriodo.jsx'
import TablaRanking from '../../components/reportes/TablaRanking.jsx'
import StatCard from '../../components/StatCard.jsx'
import Titulo from '../../components/Titulo.jsx'
import usePolling from '../../hooks/usePolling.js'
import { mensajeError, tarjeta, textoSuave } from '../../utils/estilos.js'
import { NOMBRES_EPP } from '../../utils/formato.js'

function Seccion({ titulo, subtitulo, children, className = '' }) {
  return (
    <section className={`${tarjeta} ${className}`}>
      <h2 className="font-semibold">{titulo}</h2>
      {subtitulo && <p className={`mb-3 text-sm ${textoSuave}`}>{subtitulo}</p>}
      {children}
    </section>
  )
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState(() => periodoDeDias(30))
  const diario = usePolling(() => getReporteDiario(periodo), 0, [periodo.desde, periodo.hasta])
  const ranking = usePolling(() => getRanking(periodo), 0, [periodo.desde, periodo.hasta])
  const d = diario.datos
  const r = ranking.datos

  const promedio = r?.empleados.length ? Math.round(r.empleados.reduce((suma, e) => suma + e.cumplimiento, 0) / r.empleados.length) : null
  const porTipo = (d?.por_tipo || []).map((t) => ({ nombre: NOMBRES_EPP[t.tipo.replace('sin_', '')], total: t.total }))
    .sort((a, b) => b.total - a.total)
  const porZona = (d?.por_zona || []).map((z) => ({ nombre: z.zona, total: z.total })).sort((a, b) => b.total - a.total)

  return (
    <>
      <Titulo titulo="Reportes" subtitulo="Alertas y cumplimiento del equipo de protección">
        <Descargas periodo={periodo} />
      </Titulo>
      <SelectorPeriodo periodo={periodo} onCambiar={setPeriodo} />
      {(diario.error || ranking.error) && <p role="alert" className={`mt-4 ${mensajeError}`}>{diario.error || ranking.error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard titulo="Alertas" valor={d?.total} detalle={d && `en ${d.dias.length} días`} />
        <StatCard titulo="Cumplimiento promedio" valor={promedio == null ? null : `${promedio}%`} detalle="de los empleados activos" />
        <StatCard titulo="Resueltas" valor={d ? (d.total ? `${Math.round((d.resueltas * 100) / d.total)}%` : '—') : null}
                  detalle={d && `${d.resueltas} de ${d.total}`} />
        <StatCard titulo="Paradas de máquina" valor={d?.paradas_maquina} detalle="por alertas de EPP" />
      </div>

      {d && (
        <>
          <Seccion titulo="Alertas por día" subtitulo="Pasá el mouse por una columna para ver qué equipo faltó" className="mt-6">
            <GraficoPorDia dias={d.dias} />
          </Seccion>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Seccion titulo="¿Qué equipo faltó?" subtitulo="Alertas por tipo de EPP">
              <GraficoBarras datos={porTipo} descripcion={porTipo.map((t) => `${t.nombre}: ${t.total}`).join(', ')} />
            </Seccion>
            <Seccion titulo="¿Dónde?" subtitulo="Alertas por zona de la planta">
              <GraficoBarras datos={porZona} descripcion={porZona.map((z) => `${z.nombre}: ${z.total}`).join(', ')} />
            </Seccion>
          </div>
        </>
      )}

      {r && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Ranking de cumplimiento</h2>
          <p className={`mb-3 text-sm ${textoSuave}`}>
            Días sin alertas sobre los {r.dias} días del período · Bien: 90 % o más · A mejorar: 75 a 89 % · Riesgo: menos de 75 %
            {r.alertas_sin_identificar > 0 && ` · ${r.alertas_sin_identificar} alertas sin persona identificada no cuentan para nadie`}
          </p>
          <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Por zona</h3>
          <TablaRanking tipo="zonas" filas={r.zonas} />
          <h3 className="mt-6 mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Por empleado</h3>
          <TablaRanking tipo="empleados" filas={r.empleados} />
        </>
      )}
    </>
  )
}
