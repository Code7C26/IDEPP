// Íconos dibujados a mano en SVG (sin librerías). Uso: <Icono nombre="robot" className="size-5" />
// Toman el color del texto (currentColor), así que se pintan con clases como text-alerta.
const TRAZOS = {
  inicio: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  alerta: <><path d="M12 3l10 18H2z" /><path d="M12 10v5" /><circle cx="12" cy="18" r=".6" /></>,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  panel: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  empleados: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c2.4.6 4 2.3 4 5.2" /></>,
  zonas: <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
  robot: <><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6" /><circle cx="12" cy="3.5" r="1" /></>,
  reportes: <><path d="M4 20h16" /><rect x="5" y="11" width="3" height="7" /><rect x="10.5" y="6" width="3" height="12" /><rect x="16" y="9" width="3" height="9" /></>,
  auditoria: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  mas: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  luna: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  campana: <><path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 004 0" /></>,
  silencio: <><path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 004 0M3 3l18 18" /></>,
  salir: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  ok: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" />,
  pausa: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />,
  // Página pública
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  camara: <><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8.5 7l1.5-3h4l1.5 3" /></>,
  ia: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9.5 9.5h5v5h-5zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  descargar: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  documento: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  candado: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  // Equipo de protección personal y máquina (los usa el mapa de la fábrica)
  casco: <><path d="M4 16a8 8 0 0116 0" /><path d="M2.5 16.5h19" /><path d="M12 8V5.5M9 9.5l-1-2.5M15 9.5l1-2.5" /></>,
  guantes: <path d="M8 21v-6.5L5.6 11a1.3 1.3 0 012.1-1.5L9 11V5a1.2 1.2 0 012.4 0v5V3.8a1.2 1.2 0 012.4 0V10V4.8a1.2 1.2 0 012.4 0V10V7a1.2 1.2 0 012.4 0v7.5L16 21z" />,
  lentes: <><path d="M3 10h18v2.5a3.5 3.5 0 01-3.5 3.5h-1.8L14 13.8h-4L8.3 16H6.5A3.5 3.5 0 013 12.5z" /><path d="M3 10l1.5-3h15L21 10" /></>,
  chaleco: <><path d="M9 3L5 6v15h5v-7h4v7h5V6l-4-3-1.5 4h-3z" /><path d="M5 12h5M14 12h5" /></>,
  maquina: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
}

export default function Icono({ nombre, className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {TRAZOS[nombre] || TRAZOS.mas}
    </svg>
  )
}
