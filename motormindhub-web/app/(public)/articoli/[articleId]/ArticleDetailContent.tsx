"use client";

import Link from "next/link";
import { useArticle } from "@/lib/articoli/useArticle";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { ArticleCard } from "@/components/public/ArticleCard";
import { SaveMenu } from "@/components/articoli/SaveMenu";

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
        <Link href="/esplora" className="mt-6 inline-block font-heading text-sm font-bold uppercase text-amber">
          ← Torna a Esplora
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wide text-fog">
        <Link href="/esplora" className="hover:text-amber">
          Esplora
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/esplora?categoriaIds=${articolo.categoriaId}`} className="hover:text-amber">
          {articolo.categoriaNome}
        </Link>
        {articolo.tag[0] && (
          <>
            <span aria-hidden="true">/</span>
            <span>{articolo.tag[0]}</span>
          </>
        )}
      </nav>

      <span className="mt-4 inline-block rounded bg-amber px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-asphalt">
        {articolo.categoriaNome}
      </span>

      <h1 className="mt-4 font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
        {articolo.titolo}
      </h1>

      <div className="mt-6 flex items-center justify-between gap-4 border-b border-paper/10 pb-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-heading text-xs font-bold text-amber"
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

      <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-chrome">
        {articolo.testo.split(/\n{2,}/).map((paragrafo, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {paragrafo}
          </p>
        ))}
      </div>

      {altriArticoli.length > 0 && (
        <section className="mt-12 border-t border-paper/10 pt-8">
          <h2 className="mb-6 font-heading text-lg font-bold uppercase tracking-wide text-paper">
            Altri articoli in {articolo.categoriaNome}
          </h2>
          <div className="flex flex-col gap-6 rounded-lg border border-paper/10 bg-carbon p-6">
            {altriArticoli.map((a) => (
              <ArticleCard key={a.id} articolo={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
