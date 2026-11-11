// Logo de DROID-E3D: una letra D amarilla con el lente de una cámara (ver el manual de marca).
// conTexto = muestra también "DROID-E3D by IDEPP" al lado.
export default function Logo({ conTexto = true, className = 'size-9' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        {/* fondo: cuadrado con puntas redondeadas */}
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#1f2328" />
        {/* letra D amarilla */}
        <path d="M15 12h17c13 0 21 9 21 20s-8 20-21 20H15z" fill="#f5b800" />
        {/* lente de la cámara */}
        <circle cx="31" cy="32" r="12" fill="#1f2328" />
        <circle cx="31" cy="32" r="5.5" fill="#f5b800" />
        {/* brillo naranja del lente */}
        <circle cx="34.5" cy="28.5" r="2.3" fill="#f97316" />
      </svg>
      {conTexto && (
        <span className="leading-none">
          <span className="block text-base font-extrabold tracking-tight">DROID-E3D</span>
          <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">by IDEPP</span>
        </span>
      )}
    </span>
  )
}
