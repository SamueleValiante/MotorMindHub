"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { useCategoryTree, countCategories } from "@/lib/categorie/useCategoryTree";
import { ArticleCard } from "@/components/public/ArticleCard";
import { SpeedometerGauge } from "@/components/public/SpeedometerGauge";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { SearchIcon } from "@/components/public/icons";

/**
 * Home (mockup 01). Numeri reali, non finti:
 * - "articoli pubblicati" e la sezione "in evidenza" vengono dalla STESSA
 *   chiamata searchArticles(ordinamento=IN_EVIDENZA): totaleRisultati conta
 *   sempre tutti i pubblicati, indipendentemente dall'ordinamento richiesto,
 *   quindi una singola fetch copre entrambi senza chiamate duplicate.
 * - "categorie tecniche" viene da getCategoryTree (conteggio nodi).
 * - "autori attivi" e "uptime piattaforma" del mockup sono state omesse:
 *   nessun endpoint pubblico le supporta (listAuthors e' riservato al
 *   Manager Autori, e non esiste alcuna metrica di uptime) — non inventarle
 *   segue la stessa disciplina gia' applicata a fotoProfilo/upload.
 * - Il ticker "LIVE — N lettori online" del mockup e' stato omesso per lo
 *   stesso motivo: implicherebbe un conteggio in tempo reale che il
 *   backend non fornisce.
 * - IN_EVIDENZA e' un valore reale di OrdinamentoArticoli, ma il backend
 *   stesso lo tratta come sinonimo di "piu' letti" (nessun campo
 *   editoriale dedicato nel modello dati, cfr. commento su
 *   OrdinamentoArticoli lato backend) — semplificazione loro, non nostra,
 *   qui riusata cosi' com'e'.
 */
export default function HomePage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const featured = useArticleSearch({ ordinamento: "IN_EVIDENZA", dimensionePagina: 4 });
  const categorie = useCategoryTree();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchValue.trim();
    router.push(query ? `/esplora?query=${encodeURIComponent(query)}` : "/esplora");
  };

  const articoliPubblicatiCount = featured.status === "ready" ? featured.result.totaleRisultati : null;
  const categorieCount = categorie.status === "ready" ? countCategories(categorie.tree) : null;

  return (
    <div className="flex flex-col gap-16 px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="font-heading text-xs font-bold uppercase tracking-wide text-amber">
            Il tuo hub tecnico automotive
          </p>
          <h1 className="font-heading text-4xl font-bold uppercase leading-tight text-paper sm:text-5xl">
            Dal minimo al <span className="text-amber">redline</span> della conoscenza{" "}
            <span className="text-ember">automotive</span>.
          </h1>
          <p className="max-w-lg text-sm text-fog">
            Guide, schede tecniche e approfondimenti verificati per chi guida, ripara, modifica o
            studia l&apos;auto — dal primo tagliando alla specifica del singolo componente.
          </p>

          <form onSubmit={handleSearch} className="flex max-w-lg gap-2">
            <label htmlFor="home-search" className="sr-only">
              Cerca articoli
            </label>
            <input
              id="home-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Cerca impianto frenante, motorizzazioni, guide all'acquisto…"
              className="w-full rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
            >
              Cerca
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/esplora"
              className="rounded-md bg-amber px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
            >
              Esplora gli articoli
            </Link>
            <Link
              href="/diventa-autore"
              className="font-heading text-sm font-bold uppercase tracking-wide text-paper"
            >
              Scrivi per noi →
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <SpeedometerGauge className="h-40 w-64" />
          {articoliPubblicatiCount !== null && (
            <p className="text-center">
              <span className="font-heading text-3xl font-bold text-amber">
                {articoliPubblicatiCount}+
              </span>
              <br />
              <span className="font-heading text-xs uppercase tracking-wide text-fog">
                Guide tecniche pubblicate
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Stats reali */}
      {(articoliPubblicatiCount !== null || categorieCount !== null) && (
        <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 border-y border-paper/10 py-6 sm:grid-cols-4">
          {articoliPubblicatiCount !== null && (
            <div>
              <p className="font-heading text-2xl font-bold text-paper">{articoliPubblicatiCount}</p>
              <p className="text-xs uppercase tracking-wide text-fog">Articoli pubblicati</p>
            </div>
          )}
          {categorieCount !== null && (
            <div>
              <p className="font-heading text-2xl font-bold text-paper">{categorieCount}</p>
              <p className="text-xs uppercase tracking-wide text-fog">Categorie tecniche</p>
            </div>
          )}
        </section>
      )}

      {/* Naviga per categoria */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
            Naviga la conoscenza, un componente alla volta.
          </h2>
        </div>

        <div className="flex-1">
          {categorie.status === "ready" && categorie.tree.length === 0 ? (
            <p className="text-sm text-fog">Nessuna categoria disponibile ancora.</p>
          ) : (
            <ul className="divide-y divide-paper/10 rounded-lg border border-paper/10">
              {categorie.status === "ready" &&
                categorie.tree.map((nodo) => (
                  <li key={nodo.id}>
                    <Link
                      href={`/esplora?categoriaIds=${nodo.id}`}
                      className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-paper hover:bg-paper/5"
                    >
                      {nodo.nome}
                      <span aria-hidden="true" className="text-fog">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      {/* In evidenza */}
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
            In evidenza questa settimana.
          </h2>
        </div>

        {featured.status === "ready" && featured.result.articoli.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title="Nessun articolo ancora"
            description="Non appena un autore pubblicherà il primo articolo, lo troverai qui."
          />
        ) : featured.status === "ready" ? (
          <div className="grid gap-6 md:grid-cols-2">
            {featured.result.articoli.map((articolo) => (
              <ArticleCard key={articolo.id} articolo={articolo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-fog">Caricamento…</p>
        )}
      </section>

      {/* CTA diventa autore */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 rounded-lg bg-carbon p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-wide text-amber">Community autori</p>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">
            Hai competenze da condividere?
          </h2>
        </div>
        <Link
          href="/diventa-autore"
          className="shrink-0 rounded-md bg-ember px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper"
        >
          Candidati come autore
        </Link>
      </section>
    </div>
  );
}
