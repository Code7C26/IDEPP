// Logo de DROID-E3D: una letra D naranja con el lente de una cámara (ver el manual de marca).
// conTexto = muestra también "DROID-E3D by IDEPP" al lado.
export default function Logo({ conTexto = true, className = 'size-9' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        {/* fondo: cuadrado con puntas redondeadas */}
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#2b2b2b" />
        {/* letra D naranja */}
        <path d="M15 12h17c13 0 21 9 21 20s-8 20-21 20H15z" fill="#f7931e" />
        {/* lente de la cámara */}
        <circle cx="31" cy="32" r="12" fill="#2b2b2b" />
        <circle cx="31" cy="32" r="5.5" fill="#f7931e" />
        {/* brillo amarillo del lente */}
        <circle cx="34.5" cy="28.5" r="2.3" fill="#f5b800" />
      </svg>
      {conTexto && (
        <span className="leading-none">
          {/* El nombre como en la caja: Montserrat gruesa e inclinada, con "E3D" en naranja */}
          <span className="block font-titulo text-base font-black tracking-tight italic">DROID-<span className="text-marca">E3D</span></span>
          <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">by IDEPP</span>
        </span>
      )}
    </span>
  )
}
