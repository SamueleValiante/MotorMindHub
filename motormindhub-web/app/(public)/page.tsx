"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { useCategoryTree, countCategories } from "@/lib/categorie/useCategoryTree";
import { HeroBackdrop } from "@/components/public/HeroBackdrop";
import { Reveal } from "@/components/shared/Reveal";
import type { ArticleSummary } from "@/lib/articoli/types";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { ClockIcon, SearchIcon } from "@/components/public/icons";

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

  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Parallasse: scorrendo, il contenuto della hero sale e sfuma, lo sfondo si muove più lentamente.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        const progress = y / window.innerHeight;
        if (heroContentRef.current) {
          heroContentRef.current.style.transform = `translate3d(0, ${y * -0.18}px, 0)`;
          heroContentRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.4));
        }
        if (heroBgRef.current) heroBgRef.current.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const roots = categorie.status === "ready" ? categorie.tree : [];
  const VISIBLE_CATEGORIES = 12;
  const visibleRoots = showAllCategories ? roots : roots.slice(0, VISIBLE_CATEGORIES);

  return (
    <div className="flex flex-col">
      {/* Hero a schermo intero: header + hero riempiono il primo viewport */}
      <section className="relative flex min-h-[calc(100svh-97px)] items-center overflow-hidden">
        <div ref={heroBgRef} className="absolute -inset-x-0 -top-0 bottom-[-30%] will-change-transform">
          <HeroBackdrop />
        </div>

        <div
          ref={heroContentRef}
          className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 will-change-transform sm:px-6 md:grid-cols-[1.4fr_1fr]"
        >
          <div className="flex flex-col gap-6">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Il tuo hub tecnico automotive
            </p>
            <h1 className="font-heading text-4xl font-bold uppercase leading-[1.05] text-paper sm:text-5xl lg:text-6xl">
              Dal minimo al <span className="text-accent">redline</span> della conoscenza{" "}
              <span className="text-ember">automotive</span>.
            </h1>
            <p className="max-w-lg text-base text-chrome">
              Guide, schede tecniche e approfondimenti verificati per chi guida, ripara, modifica o
              studia l&apos;auto — dal primo tagliando alla specifica del singolo componente.
            </p>

            <form onSubmit={handleSearch} className="flex max-w-xl gap-2">
              <label htmlFor="home-search" className="sr-only">
                Cerca articoli
              </label>
              <input
                id="home-search"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Cerca impianto frenante, motorizzazioni, guide all'acquisto…"
                className="w-full rounded-md border border-paper/10 bg-carbon/80 px-4 py-3 text-sm text-chrome outline-none backdrop-blur focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
              >
                Cerca
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/esplora"
                className="rounded-md bg-accent px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
              >
                Esplora gli articoli
              </Link>
              <a
                href="#categorie"
                className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
              >
                Scopri le categorie ↓
              </a>
            </div>
          </div>

          <div className="hidden flex-col items-center gap-6 md:flex">
            <div className="grid w-full max-w-xs grid-cols-2 gap-4 rounded-lg border border-paper/10 bg-carbon/70 p-4 text-center backdrop-blur">
              {articoliPubblicatiCount !== null && (
                <div>
                  <p className="font-heading text-3xl font-bold text-accent">{articoliPubblicatiCount}</p>
                  <p className="text-xs uppercase tracking-wide text-fog">Guide tecniche</p>
                </div>
              )}
              {categorieCount !== null && (
                <div>
                  <p className="font-heading text-3xl font-bold text-paper">{categorieCount}</p>
                  <p className="text-xs uppercase tracking-wide text-fog">Categorie</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-asphalt to-transparent" />
        <a
          href="#categorie"
          aria-label="Scorri verso le categorie"
          className="mmh-float absolute bottom-6 z-10 left-1/2 -translate-x-1/2 text-chrome"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      <div className="flex flex-col gap-24 bg-asphalt px-4 py-20 sm:px-6">
        {/* Naviga per categoria: griglia di riquadri */}
        <section id="categorie" className="mx-auto w-full max-w-6xl scroll-mt-24">
          <Reveal>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">Categorie</p>
            <h2 className="mt-2 max-w-xl font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
              Naviga la conoscenza, un componente alla volta.
            </h2>
          </Reveal>

          {categorie.status === "ready" && roots.length === 0 ? (
            <p className="mt-8 text-sm text-fog">Nessuna categoria disponibile ancora.</p>
          ) : (
            <>
              <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {visibleRoots.map((nodo, i) => (
                  <li key={nodo.id}>
                    <Reveal delay={(i % 4) * 70} className="h-full">
                      <Link
                        href={`/esplora?categoriaIds=${nodo.id}`}
                        className="group relative flex h-full min-h-32 flex-col justify-between overflow-hidden rounded-xl border border-paper/10 bg-carbon p-4 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_12px_32px_-12px_rgba(61,169,252,0.45)] sm:min-h-36 sm:p-5"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-2 -top-4 font-heading text-7xl font-bold text-paper/[0.04] transition duration-500 group-hover:-translate-x-1 group-hover:text-accent/15"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
                        <span className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-paper transition-colors group-hover:text-accent sm:text-xl">
                          {nodo.nome}
                        </span>
                        <span className="mt-4 flex items-center justify-between text-xs uppercase tracking-wide text-fog">
                          <span>
                            {nodo.figlie.length > 0
                              ? `${nodo.figlie.length} ${nodo.figlie.length === 1 ? "sezione" : "sezioni"}`
                              : "Esplora"}
                          </span>
                          <span aria-hidden="true" className="text-base transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent">
                            →
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>

              {roots.length > VISIBLE_CATEGORIES && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="rounded-md border border-chrome/40 px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-chrome"
                  >
                    {showAllCategories ? "Mostra meno" : `Mostra tutte le ${roots.length} categorie`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* In evidenza */}
        <section className="mx-auto w-full max-w-6xl">
          <Reveal>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">Più letti</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
                In evidenza questa settimana.
              </h2>
              <Link href="/esplora" className="font-heading text-sm font-bold uppercase tracking-wide text-accent">
                Vedi tutti →
              </Link>
            </div>
          </Reveal>

          {featured.status === "ready" && featured.result.articoli.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<SearchIcon className="h-6 w-6" />}
                title="Nessun articolo ancora"
                description="Non appena un autore pubblicherà il primo articolo, lo troverai qui."
              />
            </div>
          ) : featured.status === "ready" ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-5">
              {featured.result.articoli[0] && (
                <Reveal className="lg:col-span-3">
                  <FeaturedMain articolo={featured.result.articoli[0]} />
                </Reveal>
              )}
              <div className="flex flex-col gap-5 lg:col-span-2">
                {featured.result.articoli.slice(1, 4).map((articolo, i) => (
                  <Reveal key={articolo.id} delay={(i + 1) * 100} className="flex-1">
                    <FeaturedSide articolo={articolo} rank={i + 2} />
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-sm text-fog">Caricamento…</p>
          )}
        </section>
      </div>
    </div>
  );
}

function FeaturedMain({ articolo }: { articolo: ArticleSummary }) {
  return (
    <Link
      href={`/articoli/${articolo.id}`}
      className="group relative flex h-full min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl border border-paper/10 bg-carbon lg:min-h-[28rem]"
    >
      {articolo.immagineCopertina ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore
        <img
          src={articolo.immagineCopertina}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-raised to-carbon" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/85 via-45% to-asphalt/30" />
      <div className="relative flex flex-col gap-3 p-6 sm:p-8">
        <span className="w-fit rounded bg-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-asphalt">
          {articolo.categoriaNome}
        </span>
        <h3 className="font-heading text-2xl font-bold uppercase leading-tight text-paper transition-colors group-hover:text-accent sm:text-3xl">
          {articolo.titolo}
        </h3>
        {articolo.estratto && <p className="line-clamp-2 max-w-xl text-sm text-chrome">{articolo.estratto}</p>}
        <p className="flex items-center gap-2 text-xs text-fog">
          <span>{articolo.autoreNome}</span>
          <span aria-hidden="true">·</span>
          <ClockIcon className="h-3.5 w-3.5" />
          {articolo.tempoLetturaMinuti} min
        </p>
      </div>
    </Link>
  );
}

function FeaturedSide({ articolo, rank }: { articolo: ArticleSummary; rank: number }) {
  return (
    <Link
      href={`/articoli/${articolo.id}`}
      className="group flex h-full gap-4 overflow-hidden rounded-xl border border-paper/10 bg-carbon p-3 transition duration-300 hover:-translate-y-0.5 hover:border-accent/60"
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-raised sm:h-28 sm:w-36">
        {articolo.immagineCopertina && (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore
          <img
            src={articolo.immagineCopertina}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-asphalt/80 px-1.5 py-0.5 font-heading text-xs font-bold text-accent">
          {String(rank).padStart(2, "0")}
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-wide text-accent">{articolo.categoriaNome}</span>
        <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-paper transition-colors group-hover:text-accent sm:text-lg">
          {articolo.titolo}
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-fog">
          <ClockIcon className="h-3.5 w-3.5" />
          {articolo.tempoLetturaMinuti} min · {articolo.autoreNome}
        </p>
      </div>
    </Link>
  );
}
