/**
 * "Elemento firma" di DESIGN_SYSTEM.md: puramente decorativo, l'ago resta
 * fermo al centro (nessun dato reale da rappresentare con la sua
 * posizione — non e' un indicatore, solo il motivo grafico ricorrente).
 *
 * Due zone, non tre: l'arco accent (blu, 80% del percorso, "dal neofita al
 * professionista") e un salto diretto — non una sfumatura — alla zona
 * redline in ember (ultimo 18%). Prima c'era una terza zona chrome e un
 * confine netto tra amber ed ember; da quando l'accento e' diventato blu
 * (#3DA9FC, cfr. DESIGN_SYSTEM.md), un confine "morbido" tra due colori così
 * lontani in tonalità (blu freddo / rosso caldo) leggeva come una zona
 * intermedia blu-violacea poco leggibile, verificato in mockup — da qui il
 * piccolo gap angolare (non un gradiente) tra i due archi, per un taglio
 * netto invece che una transizione organica.
 */
export function SpeedometerGauge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <path
        d="M20 110 A80 80 0 0 1 164.72 62.98"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M167.55 67.13 A80 80 0 0 1 180 110"
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
