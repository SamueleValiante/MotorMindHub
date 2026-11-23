/**
 * Indicatore di caricamento a tre pallini (stile "sta scrivendo"), unico in
 * tutto il sito al posto del testo "Caricamento…".
 *
 * - Variante a blocco (default): invisibile per i primi 350ms (.mmh-loading),
 *   così i caricamenti rapidi non mostrano nulla; poi compare in dissolvenza.
 * - Variante inline (es. dentro un pulsante durante un upload): nessun
 *   ritardo, eredita il colore del testo circostante.
 *
 * data-mmh-loader: segnale per MotionObserver — quando questo elemento viene
 * sostituito dal contenuto caricato, il contenuto entra con l'animazione del
 * sito invece di comparire di colpo. Il testo resta disponibile a screen
 * reader (e ai test e2e) come etichetta sr-only.
 */
export function LoadingDots({
  label = "Caricamento…",
  inline = false,
  className = "",
}: {
  label?: string;
  inline?: boolean;
  className?: string;
}) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      role="status"
      data-mmh-loader=""
      className={
        inline
          ? `mmh-dots inline-flex items-center gap-1 align-middle ${className}`
          : `mmh-loading mmh-dots flex items-center gap-1.5 py-2 text-accent ${className}`
      }
    >
      <span aria-hidden="true" className="mmh-dot" />
      <span aria-hidden="true" className="mmh-dot" />
      <span aria-hidden="true" className="mmh-dot" />
      <span className="sr-only">{label}</span>
    </Tag>
  );
}
