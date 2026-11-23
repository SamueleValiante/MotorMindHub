/**
 * Indicatore di caricamento a tre pallini grigio chiaro (text-chrome) che si
 * accendono in sequenza — solo intensità, nessun movimento — unico in tutto
 * il sito al posto del testo "Caricamento…".
 *
 * Varianti:
 * - "page" (default): la pagina intera è in attesa → pallini al centro dello
 *   schermo (fixed, non intercetta i click), con un segnaposto in flusso che
 *   tiene il posto del contenuto.
 * - "section": una parte della pagina è in attesa (una sezione della
 *   dashboard, i risultati di Esplora) → centrati nello spazio di quella parte.
 * - "inline": dentro un elemento (es. pulsante durante un upload), senza
 *   ritardo né spazio extra.
 *
 * "page" e "section" restano invisibili per i primi 350ms (.mmh-loading):
 * i caricamenti rapidi non mostrano nulla.
 *
 * data-mmh-loader: segnale per MotionObserver — quando questo elemento viene
 * sostituito dal contenuto caricato, il contenuto entra con l'animazione del
 * sito invece di comparire di colpo. Il testo resta disponibile a screen
 * reader (e ai test e2e) come etichetta sr-only.
 */
const VARIANT_CLASS = {
  page: "mmh-loading pointer-events-none fixed inset-0 flex items-center justify-center",
  section: "mmh-loading flex w-full items-center justify-center py-10",
  inline: "inline-flex items-center",
} as const;

function Dots({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true" className="mmh-dot" />
      <span aria-hidden="true" className="mmh-dot" />
      <span aria-hidden="true" className="mmh-dot" />
      <span className="sr-only">{label}</span>
    </>
  );
}

export function LoadingDots({
  label = "Caricamento…",
  variant = "page",
  className = "",
}: {
  label?: string;
  variant?: keyof typeof VARIANT_CLASS;
  className?: string;
}) {
  if (variant === "page") {
    // Segnaposto in flusso (min-h-[60svh]) + pallini fixed al centro dello schermo: senza il
    // segnaposto la pagina in attesa non occuperebbe spazio e il footer delle pagine pubbliche
    // salirebbe sotto l'header, finendo dietro ai pallini.
    return (
      <div role="status" data-mmh-loader="" className={`min-h-[60svh] ${className}`}>
        <div className={`mmh-dots text-chrome ${VARIANT_CLASS.page}`}>
          <Dots label={label} />
        </div>
      </div>
    );
  }
  const Tag = variant === "inline" ? "span" : "div";
  return (
    <Tag role="status" data-mmh-loader="" className={`mmh-dots text-chrome ${VARIANT_CLASS[variant]} ${className}`}>
      <Dots label={label} />
    </Tag>
  );
}
