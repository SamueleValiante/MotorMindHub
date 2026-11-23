"use client";

import Link from "next/link";
import { useArticle } from "@/lib/articoli/useArticle";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { ArticleCard } from "@/components/public/ArticleCard";
import { SaveMenu } from "@/components/articoli/SaveMenu";
import { ArticleView } from "@/components/articoli/ArticleView";

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
    return <p className="mmh-loading mx-auto max-w-3xl px-4 py-12 text-sm text-fog sm:px-6">Caricamento…</p>;
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
    <div className="mmh-own-motion mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <ArticleView articolo={articolo} actions={<SaveMenu articleId={articolo.id} />} />

      {altriArticoli.length > 0 && (
        <section className="mmh-rise mt-12 border-t border-paper/10 pt-8 [--mmh-start:var(--mmh-content-start)] [--mmh-i:7]">
          <h2 className="mb-6 font-heading text-lg font-bold uppercase tracking-wide text-paper">
            Altri articoli in {articolo.categoriaNome}
          </h2>
          {/*
            md:grid-cols-2 solo con 2+ risultati: con un solo elemento, quella
            seconda colonna resterebbe comunque riservata da CSS Grid (le
            tracce sono definite a prescindere dal numero di figli) - l'unica
            card occuperebbe solo la prima, lasciando la seconda vuota nello
            stesso riquadro bordato (bug segnalato: sembra che l'immagine non
            riempia la card, in realtà è la card stessa a occupare solo metà
            del riquadro). Senza md:grid-cols-2 il grid resta a una colonna
            (stesso comportamento già corretto di mobile), la card unica
            occupa l'intera larghezza del riquadro. Il caso 3 risultati (2+1,
            ultima riga a metà) non rientra in questo fix: è un trailing row
            parziale comune, diverso dall'intero riquadro semi-vuoto segnalato.
          */}
          <div
            className={`grid gap-6 rounded-lg border border-paper/10 bg-carbon p-6 ${
              altriArticoli.length > 1 ? "md:grid-cols-2" : ""
            }`}
          >
            {altriArticoli.map((a) => (
              <ArticleCard key={a.id} articolo={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
