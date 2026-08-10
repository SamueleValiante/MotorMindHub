"use client";

import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useArticle } from "@/lib/articoli/useArticle";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { ArticleCard } from "@/components/public/ArticleCard";
import { SaveMenu } from "@/components/articoli/SaveMenu";

/**
 * Solo h2/h3/img hanno bisogno di uno stile esplicito qui: p/strong/em non
 * lo richiedono, ereditano già color/font-size/line-height dal div
 * wrapper (text-base leading-loose text-paper) per normale cascata CSS —
 * aggiungere qui una regola identica sarebbe una ridondanza. article-body-image
 * usa i18n minimale: alt e' obbligatorio lato editor (InsertImageAltModal),
 * quindi qui non serve un fallback.
 */
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-8 font-heading text-xl font-bold uppercase tracking-wide text-paper">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-heading text-lg font-bold uppercase tracking-wide text-paper">{children}</h3>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- URL Cloudinary arbitraria inserita dall'autore, stesso pattern della copertina sopra
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="my-2 w-full rounded-lg" />
  ),
};

function initials(nomeCompleto: string): string {
  const parts = nomeCompleto.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

function formatAggiornato(iso: string): string {
  const date = new Date(iso);
  const oggi = new Date();
  const giorni = Math.floor((oggi.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000);
  if (giorni === 0) return "oggi";
  if (giorni === 1) return "ieri";
  return `il ${new Date(iso).toLocaleDateString("it-IT")}`;
}

/**
 * Dettaglio Articolo (mockup 03). Il mockup mostra anche un'icona
 * "bandiera" accanto al segnalibro: verificato su Swagger che l'unico
 * endpoint di segnalazione è reportUser (ReportUserDTO ha solo
 * segnalatoId+motivazione, nessun articleId) — non esiste una
 * segnalazione-contenuto distinta dalla segnalazione di un utente.
 * Ripiegare su "segnala l'autore" avrebbe travestito da azione sul
 * contenuto un'azione che in realtà colpisce un'altra persona: omessa,
 * stessa disciplina già applicata a fotoProfilo/upload/filtri inesistenti.
 *
 * I 3 articoli in coda al mockup non sono "correlati" in senso stretto:
 * nessun endpoint di raccomandazione/similarità esiste (searchArticles,
 * getArticleById e basta). Qui sono altri articoli della STESSA categoria
 * via searchArticles(categoriaIds=[categoria corrente]) — dato reale,
 * etichettato per quello che è ("Altri articoli in {categoria}"), non
 * spacciato per una raccomandazione che non esiste.
 */
export function ArticleDetailContent({ articleId }: { articleId: string }) {
  const parsedId = /^\d+$/.test(articleId) ? Number(articleId) : null;
  const state = useArticle(parsedId);

  const articolo = state.status === "found" ? state.articolo : null;
  const correlati = useArticleSearch(
    articolo
      ? { categoriaIds: [articolo.categoriaId], dimensionePagina: 4, ordinamento: "PIU_RECENTI" }
      : { dimensionePagina: 0 }
  );
  const altriArticoli =
    articolo && correlati.status === "ready"
      ? correlati.result.articoli.filter((a) => a.id !== articolo.id).slice(0, 3)
      : [];

  if (state.status === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-12 text-sm text-fog sm:px-6">Caricamento…</p>;
  }

  if (state.status === "not-found" || !articolo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
          Articolo non trovato
        </h1>
        <p className="mt-2 text-sm text-fog">
          Questo articolo non esiste o non è più disponibile.
        </p>
        <Link href="/esplora" className="mt-6 inline-block font-heading text-sm font-bold uppercase text-accent">
          ← Torna a Esplora
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wide text-fog">
        <Link href="/esplora" className="hover:text-accent">
          Esplora
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/esplora?categoriaIds=${articolo.categoriaId}`} className="hover:text-accent">
          {articolo.categoriaNome}
        </Link>
        {articolo.tag[0] && (
          <>
            <span aria-hidden="true">/</span>
            <span>{articolo.tag[0]}</span>
          </>
        )}
      </nav>

      <span className="mt-4 inline-block rounded bg-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-asphalt">
        {articolo.categoriaNome}
      </span>

      <h1 className="mt-4 font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
        {articolo.titolo}
      </h1>

      <div className="mt-6 flex items-center justify-between gap-4 border-b border-paper/10 pb-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-heading text-xs font-bold text-accent"
          >
            {initials(articolo.autoreNome)}
          </div>
          <div>
            <p className="text-sm font-semibold text-paper">{articolo.autoreNome}</p>
            <p className="text-xs text-fog">
              {articolo.tempoLetturaMinuti} min di lettura · Aggiornato {formatAggiornato(articolo.dataUltimoAggiornamento)}
            </p>
          </div>
        </div>

        <SaveMenu articleId={articolo.id} />
      </div>

      {articolo.immagineCopertina ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore, non ottimizzabile da next/image senza un dominio remoto configurato
        <img
          src={articolo.immagineCopertina}
          alt=""
          className="mt-8 aspect-video w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mt-8 aspect-video w-full rounded-lg bg-surface-raised" />
      )}

      {/*
        text-paper, non text-chrome: il corpo dell'articolo è il contenuto
        principale che il lettore è lì per leggere, non testo secondario —
        chrome (DESIGN_SYSTEM.md: "bordi, icone, testo secondario chiaro")
        supera comunque la soglia WCAG AA qui, ma è il ruolo semantico
        sbagliato. Stesso fix già applicato al testo scritto dall'autore in
        ArticleEditor.tsx. Titolo (h1), nome autore e "Altri articoli in
        {categoria}" erano già in paper; breadcrumb e data/tempo di lettura
        restano in fog, sono davvero metadata secondari.

        text-base + leading-loose: un corpo articolo lungo va letto
        comodamente, non compresso come un elemento UI secondario —
        verificato dal vivo con screenshot che il risultato non sia
        eccessivamente arioso. Stessa dimensione/interlinea di
        ArticleBodyEditor.tsx per coerenza tra scrittura e lettura.

        react-markdown (+ remark-gfm) sostituisce lo split manuale su
        doppio a-capo: i due articoli di test preesistenti (testo semplice,
        nessuna sintassi Markdown) restano un unico <p>, stesso identico
        risultato di prima — nessuna riscrittura necessaria in database.
        gap-6 non serve più qui (era lo spazio tra i <p> generati a mano):
        i <p> di react-markdown si susseguono nel flusso normale, la
        spaziatura tra paragrafi/heading è nelle classi margin-top sopra
        (h2/h3) o, per i <p> stessi, ereditata implicitamente dal margin di
        default dell'elemento — verificato dal vivo che resti leggibile.
      */}
      <div data-testid="articolo-corpo" className="mt-8 text-base leading-loose text-paper [&_p+p]:mt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {articolo.testo}
        </ReactMarkdown>
      </div>

      {altriArticoli.length > 0 && (
        <section className="mt-12 border-t border-paper/10 pt-8">
          <h2 className="mb-6 font-heading text-lg font-bold uppercase tracking-wide text-paper">
            Altri articoli in {articolo.categoriaNome}
          </h2>
          <div className="grid gap-6 rounded-lg border border-paper/10 bg-carbon p-6 md:grid-cols-2">
            {altriArticoli.map((a) => (
              <ArticleCard key={a.id} articolo={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
