"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { useCategoryTree, countCategories } from "@/lib/categorie/useCategoryTree";
import { HeroBackdrop } from "@/components/public/HeroBackdrop";
import { ScrollArrow } from "@/components/public/ScrollArrow";
import { smoothScrollTo } from "@/lib/ui/smoothScroll";
import { CategoryTile } from "@/components/public/CategoryTile";
import { ArticleCard } from "@/components/public/ArticleCard";
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
const TRUST_POINTS = [
  {
    title: "Contenuti verificati",
    text: "Ogni articolo viene letto e approvato da un Manager Autori prima della pubblicazione: niente testo che va online senza revisione.",
    icon: <path d="M9 12l2 2 4-4M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Fonti citate",
    text: "Dati, prezzi e specifiche riportano la fonte e l'anno di riferimento, così puoi controllare tu stesso da dove arriva ogni numero.",
    icon: <path d="M4 5h11a3 3 0 013 3v11H7a3 3 0 01-3-3V5zM8 9h6M8 13h6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Autori qualificati",
    text: "Scrivono solo autori invitati dalla redazione, con nome e cognome in chiaro su ogni articolo e un profilo pubblico.",
    icon: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const featured = useArticleSearch({ ordinamento: "IN_EVIDENZA", dimensionePagina: 4 });
  const latest = useArticleSearch({ ordinamento: "PIU_RECENTI", dimensionePagina: 6 });
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
    // mmh-own-motion: la home ha una coreografia propria (sfondo → testi), non la cascata generica di pagina.
    <div className="mmh-own-motion flex flex-col">
      {/* Hero a schermo intero: header + hero riempiono il primo viewport.
          Ingresso: lo sfondo si dissolve per primo (HeroBackdrop, .mmh-bg), poi a 600ms
          i testi emergono uno dopo l'altro, sempre con lo stesso passo (--mmh-step). */}
      <section className="relative flex min-h-[calc(100svh-73px)] items-end overflow-hidden lg:items-center">
        <div ref={heroBgRef} className="absolute -inset-x-0 -top-0 bottom-[-12%] will-change-transform">
          <HeroBackdrop />
        </div>

        <div
          ref={heroContentRef}
          className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-20 pt-[26svh] will-change-transform [--mmh-start:600ms] sm:px-6 lg:py-16"
        >
          <div className="flex max-w-2xl flex-col gap-6">
            <p className="mmh-rise font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent [--mmh-i:0]">
              Il tuo hub tecnico automotive
            </p>
            <h1 className="mmh-rise font-heading text-4xl font-bold uppercase leading-[1.05] text-paper sm:text-5xl lg:text-6xl [--mmh-i:1]">
              Dal minimo al <span className="text-accent">redline</span> della conoscenza{" "}
              <span className="text-ember">automotive</span>.
            </h1>
            <p className="mmh-rise max-w-lg text-base text-chrome [--mmh-i:2]">
              Guide, schede tecniche e approfondimenti verificati per chi guida, ripara, modifica o
              studia l&apos;auto — dal primo tagliando alla specifica del singolo componente.
            </p>

            <form onSubmit={handleSearch} className="mmh-rise flex max-w-xl gap-2 [--mmh-i:3]">
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

            <div className="mmh-rise flex flex-wrap items-center gap-6 [--mmh-i:4]">
              <Link
                href="/esplora"
                className="rounded-md bg-accent px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
              >
                Esplora gli articoli
              </Link>
              <a
                href="#categorie"
                onClick={(e) => smoothScrollTo(e, "categorie")}
                className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
              >
                Scopri le categorie ↓
              </a>
            </div>

            {/* Sempre presente (altezza riservata): i numeri arrivano dopo la fetch e si
                dissolvono al loro posto, senza spostare il resto della hero. */}
            <p className="mmh-rise flex min-h-7 flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-wide text-fog [--mmh-i:5]">
              {articoliPubblicatiCount !== null && (
                <span className="mmh-fade [--mmh-start:0ms] [--mmh-i:0]">
                  <span className="font-heading text-lg font-bold text-accent">{articoliPubblicatiCount}</span> guide tecniche
                </span>
              )}
              {categorieCount !== null && (
                <span className="mmh-fade [--mmh-start:0ms] [--mmh-i:1]">
                  <span className="font-heading text-lg font-bold text-paper">{categorieCount}</span> categorie
                </span>
              )}
            </p>
          </div>

        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-asphalt to-transparent" />
        <a
          href="#categorie"
          onClick={(e) => smoothScrollTo(e, "categorie")}
          aria-label="Scorri verso le categorie"
          className="mmh-float absolute bottom-6 z-10 left-1/2 -translate-x-1/2 text-chrome"
        >
          <svg
            viewBox="0 0 24 24"
            className="mmh-fade h-7 w-7 [--mmh-start:1500ms]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
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
                      <CategoryTile node={nodo} index={i} href={`/esplora?categoriaIds=${nodo.id}`} />
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
          <ScrollArrow to="evidenza" label="Vai agli articoli in evidenza" />
        </section>

        {/* In evidenza */}
        <section id="evidenza" className="mx-auto w-full max-w-6xl scroll-mt-24">
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
            <p className="mmh-loading mt-8 text-sm text-fog">Caricamento…</p>
          )}
          <ScrollArrow to="ultimi" label="Vai agli ultimi articoli" />
        </section>

        {/* Ultimi articoli */}
        <section id="ultimi" className="mx-auto w-full max-w-6xl scroll-mt-24">
          <Reveal>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">Appena pubblicati</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
                Ultimi articoli.
              </h2>
              <Link href="/esplora" className="font-heading text-sm font-bold uppercase tracking-wide text-accent">
                Esplora tutto →
              </Link>
            </div>
          </Reveal>

          {latest.status === "ready" && latest.result.articoli.length > 0 ? (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.result.articoli.map((articolo, i) => (
                <li key={articolo.id}>
                  <Reveal delay={(i % 3) * 90} className="h-full">
                    <div className="h-full rounded-xl border border-paper/10 bg-carbon p-4 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_12px_32px_-12px_rgba(61,169,252,0.35)]">
                      <ArticleCard articolo={articolo} />
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : latest.status === "ready" ? (
            <p className="mt-8 text-sm text-fog">Nessun articolo pubblicato ancora.</p>
          ) : (
            <p className="mmh-loading mt-8 text-sm text-fog">Caricamento…</p>
          )}
          <ScrollArrow to="fiducia" label="Vai a come lavoriamo" />
        </section>

        {/* Fiducia ed editoria */}
        <section id="fiducia" className="mx-auto w-full max-w-6xl scroll-mt-24">
          <div className="relative overflow-hidden rounded-2xl border border-paper/10 bg-carbon px-6 py-12 sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
            />
            <Reveal>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-accent">Come lavoriamo</p>
              <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
                Informazione tecnica di cui puoi fidarti.
              </h2>
            </Reveal>

            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {TRUST_POINTS.map((point, i) => (
                <li key={point.title}>
                  <Reveal delay={i * 110} className="h-full">
                    <div className="h-full rounded-xl border border-paper/10 bg-asphalt/60 p-6">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          {point.icon}
                        </svg>
                      </span>
                      <h3 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">{point.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-chrome">{point.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>

            <Reveal delay={300}>
              <Link
                href="/linee-guida-editoriali"
                className="mt-10 inline-block rounded-md border border-chrome/40 px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-chrome"
              >
                Leggi le linee guida editoriali →
              </Link>
            </Reveal>
          </div>
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
