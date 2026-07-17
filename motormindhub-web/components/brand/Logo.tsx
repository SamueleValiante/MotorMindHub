/**
 * Wordmark + icona a "contagiri" (l'elemento firma di DESIGN_SYSTEM.md,
 * qui in versione minimale da logo — la versione elaborata resta per
 * l'hero della Home, non ancora costruita).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <path d="M12 12 L8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
      <span className="font-heading text-lg font-bold uppercase tracking-wide">
        <span className="text-paper">MotorMind</span>
        <span className="text-amber">Hub</span>
      </span>
    </div>
  );
}
