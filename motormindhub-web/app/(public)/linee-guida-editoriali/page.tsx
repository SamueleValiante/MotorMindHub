import Link from "next/link";

export const metadata = {
  title: "Linee guida editoriali — MotorMindHub",
  description: "Come vengono scritti, verificati e pubblicati gli articoli di MotorMindHub.",
};

const SECTIONS = [
  {
    title: "Autori",
    body: [
      "Gli articoli sono scritti da autori invitati dalla redazione. Nome e cognome dell'autore sono sempre visibili su ogni articolo e ogni autore ha un profilo pubblico.",
      "Gli autori scrivono su argomenti che conoscono e si assumono la responsabilità di ciò che pubblicano.",
    ],
  },
  {
    title: "Verifica prima della pubblicazione",
    body: [
      "Nessun articolo va online direttamente: ogni testo passa da una revisione del Manager Autori, che può approvarlo oppure rifiutarlo indicando una motivazione. L'autore può correggere e inviare di nuovo.",
      "La revisione riguarda correttezza, chiarezza, completezza e rispetto di queste linee guida.",
    ],
  },
  {
    title: "Fonti e dati",
    body: [
      "Dati tecnici, prezzi, quotazioni, richiami e statistiche riportano la fonte e il periodo di riferimento. Quando fonti diverse danno cifre diverse, l'articolo lo dice e mostra le differenze invece di scegliere in silenzio.",
      "Prezzi, listini e disponibilità cambiano nel tempo: ogni articolo indica la data dell'ultimo aggiornamento.",
    ],
  },
  {
    title: "Sicurezza",
    body: [
      "Le procedure e i valori tecnici hanno scopo informativo e non sostituiscono la documentazione ufficiale del costruttore né il parere di un tecnico qualificato.",
      "Per interventi su freni, sterzo, impianto elettrico e sistemi ad alta tensione consigliamo sempre un'officina autorizzata.",
    ],
  },
  {
    title: "Correzioni e segnalazioni",
    body: [
      "Se trovi un errore, un dato superato o un contenuto che ritieni violi i tuoi diritti, scrivici: lo facciamo verificare e, se serve, correggere o rimuovere.",
    ],
  },
  {
    title: "Immagini e marchi",
    body: [
      "Le immagini restano dei rispettivi autori. Marchi, nomi di modelli e loghi appartengono ai rispettivi titolari e sono citati a solo scopo informativo; MotorMindHub non è affiliato né sponsorizzato dai costruttori.",
    ],
  },
];

export default function LineeGuidaEditorialiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wide text-accent">
        <span aria-hidden="true" className="h-px w-6 bg-accent" />
        Linee guida editoriali
      </p>
      <h1 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
        Come nasce un articolo di MotorMindHub.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-fog">
        Contenuti verificati, fonti citate, autori riconoscibili: ecco le regole che seguiamo per scrivere,
        controllare e aggiornare ciò che trovi sul sito.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="border-t border-paper/10 pt-6">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3 text-base leading-relaxed text-chrome">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-fog">
        Per segnalazioni e contatti: supporto@motormindhub.com ·{" "}
        <Link href="/esplora" className="text-accent">
          Torna a Esplora
        </Link>
      </p>
    </div>
  );
}
