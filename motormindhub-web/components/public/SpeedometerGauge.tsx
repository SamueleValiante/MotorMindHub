/**
 * "Elemento firma" di DESIGN_SYSTEM.md: puramente decorativo, l'ago resta
 * fermo al centro (nessun dato reale da rappresentare con la sua
 * posizione — non e' un indicatore, solo il motivo grafico ricorrente).
 */
export function SpeedometerGauge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <path
        d="M20 110 A80 80 0 0 1 76 33"
        fill="none"
        stroke="var(--color-chrome)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M76 33 A80 80 0 0 1 124 33"
        fill="none"
        stroke="var(--color-amber)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M124 33 A80 80 0 0 1 180 110"
        fill="none"
        stroke="var(--color-ember)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <line x1="100" y1="110" x2="65" y2="55" stroke="var(--color-paper)" strokeWidth={3} strokeLinecap="round" />
      <circle cx="100" cy="110" r="7" fill="var(--color-paper)" />
    </svg>
  );
}
