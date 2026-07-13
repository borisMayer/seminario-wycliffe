export function Emblem({ size = 40, className = '' }: { size?: number; className?: string }) {
  const gold = '#C9A84C'
  const goldLight = '#E8C97A'
  const navy = '#021A38'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Emblema del Seminario Wycliffe"
    >
      {/* Escudo */}
      <path
        d="M50 4 L90 16 V52 C90 74 72 89 50 96 C28 89 10 74 10 52 V16 Z"
        fill={navy}
        stroke={gold}
        strokeWidth="2.5"
      />
      <path
        d="M50 10 L84 20.5 V51 C84 69.5 68.5 82.5 50 89 C31.5 82.5 16 69.5 16 51 V20.5 Z"
        fill="none"
        stroke={goldLight}
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Cruz superior */}
      <rect x="47.5" y="18" width="5" height="16" rx="1" fill={goldLight} />
      <rect x="42" y="22.5" width="16" height="5" rx="1" fill={goldLight} />
      {/* Libro abierto */}
      <path
        d="M22 52 C32 46 42 46 50 52 C58 46 68 46 78 52 V72 C68 66 58 66 50 72 C42 66 32 66 22 72 Z"
        fill={gold}
      />
      <path
        d="M50 52 V72"
        stroke={navy}
        strokeWidth="2"
      />
      {/* Líneas de texto en las páginas */}
      <path d="M28 55 C34 51.5 42 51.5 46 54.5 M28 60 C34 56.5 42 56.5 46 59.5 M28 65 C34 61.5 42 61.5 46 64.5" stroke={navy} strokeWidth="1.1" fill="none" opacity="0.55" />
      <path d="M72 55 C66 51.5 58 51.5 54 54.5 M72 60 C66 56.5 58 56.5 54 59.5 M72 65 C66 61.5 58 61.5 54 64.5" stroke={navy} strokeWidth="1.1" fill="none" opacity="0.55" />
      {/* Lema */}
      <text x="50" y="82" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6" letterSpacing="0.5" fill={goldLight}>VERITAS</text>
    </svg>
  )
}
