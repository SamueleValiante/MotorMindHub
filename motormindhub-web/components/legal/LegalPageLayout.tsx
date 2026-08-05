interface LegalSection {
  heading: string;
  body: string;
}

interface LegalPageLayoutProps {
  title: string;
  ultimoAggiornamento: string;
  sections: LegalSection[];
}

/**
 * Struttura condivisa dai documenti legali: eyebrow, titolo, data, elenco
 * di sezioni. Termini/Cookie Policy/Accessibilità seguono i mockup 11/12/13;
 * Informativa Privacy (RNF5.1, Art. 13 GDPR) non ha un mockup dedicato —
 * riusa comunque questo stesso layout per coerenza visiva con le altre.
 */
export function LegalPageLayout({ title, ultimoAggiornamento, sections }: LegalPageLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wide text-amber">
        <span aria-hidden="true" className="h-px w-6 bg-amber" />
        Documento legale
      </p>
      <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-paper sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-fog">
        Ultimo aggiornamento: {ultimoAggiornamento}
      </p>

      <hr className="my-8 border-paper/10" />

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-lg font-bold text-paper">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
