"use client";

import Link from "next/link";
import { useMyArticles } from "@/lib/articoli/useMyArticles";
import { ArticleCard } from "@/components/public/ArticleCard";
import { StatoBadge } from "@/components/articoli/StatoBadge";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { DocumentIcon } from "@/components/autore/icons";

const ULTIMI_ARTICOLI_COUNT = 4;
const PIU_LETTI_COUNT = 5;

/**
 * Dashboard Autore (mockup 21). Le 4 stat vengono tutte da
 * getArticlesByAuthor (contando per stato + sommando numeroVisualizzazioni),
 * non da getManagerDashboardStats: quell'endpoint (GET /autori/dashboard)
 * è riservato a MANAGER_AUTORI (hasRole('MANAGER_AUTORI'), verificato sul
 * controller) e restituisce contatori dell'INTERA piattaforma
 * (ManagerDashboardStatsDTO: articoliPubblicati/autoriAttivi/... globali),
 * non i numeri del singolo autore mostrati in questo mockup — un Autore
 * semplice (non anche Manager) ne riceverebbe un 403. Le mini-varianti
 * "+12 questo mese" / "+3.2% settimana" del mockup sono state omesse:
 * nessun endpoint (né questo né getManagerDashboardStats, che infatti non
 * ha alcun campo di trend) offre uno storico per calcolarle davvero.
 */
export default function DashboardAutorePage() {
  const state = useMyArticles();
  const articoli = state.status === "ready" ? state.articoli : [];

  const pubblicati = articoli.filter((a) => a.stato === "PUBBLICATO").length;
  const inRevisione = articoli.filter((a) => a.stato === "IN_ATTESA_APPROVAZIONE").length;
  const bozze = articoli.filter((a) => a.stato === "BOZZA").length;
  const lettureTotali = articoli.reduce((sum, a) => sum + a.numeroVisualizzazioni, 0);

  const ultimiArticoli = articoli.slice(0, ULTIMI_ARTICOLI_COUNT);

  // Solo PUBBLICATO: numeroVisualizzazioni ha senso solo per un lettore
  // reale (cfr. GestioneArticoli.viewArticle, mai incrementato per un ruolo
  // redazionale che rilegge/rivede il proprio articolo) - bozze/in revisione/
  // rifiutati sarebbero comunque sempre a 0, elencarli in una classifica
  // "più letti" sarebbe fuorviante. Stessa lista già caricata da useMyArticles,
  // nessuna nuova chiamata: getArticlesByAuthor non e' paginato, e' l'intero
  // elenco dell'autore, ordinarlo client-side per numeroVisualizzazioni e'
  // sufficiente (a differenza di Esplora, dove il backend deve ordinare
  // prima di paginare).
  const piuLetti = articoli
    .filter((a) => a.stato === "PUBBLICATO")
    .toSorted((a, b) => b.numeroVisualizzazioni - a.numeroVisualizzazioni)
    .slice(0, PIU_LETTI_COUNT);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Dashboard
        </h1>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare i tuoi articoli.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <StatCard value={pubblicati} label="Articoli pubblicati" variant="accent" />
            <StatCard value={inRevisione} label="In attesa di approvazione" />
            <StatCard value={bozze} label="Bozze salvate" />
            <StatCard value={lettureTotali} label="Letture totali" />
          </div>

          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
                I tuoi ultimi articoli
              </h2>
              <Link
                href="/autore/articoli/nuovo"
                className="shrink-0 rounded-md bg-accent px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-wide text-asphalt"
              >
                + Nuovo articolo
              </Link>
            </div>

            {ultimiArticoli.length === 0 ? (
              <EmptyState
                icon={<DocumentIcon className="h-6 w-6" />}
                title="Nessun articolo ancora"
                description="I tuoi articoli e le tue bozze compariranno qui non appena ne creerai uno."
                action={{ label: "Nuovo articolo", href: "/autore/articoli/nuovo" }}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {ultimiArticoli.map((articolo) => (
                  <ArticleCard
                    key={articolo.id}
                    articolo={articolo}
                    linkable={articolo.stato === "PUBBLICATO"}
                    badge={<StatoBadge stato={articolo.stato} />}
                  />
                ))}
              </div>
            )}
          </section>

          {/*
            Lista compatta (titolo + conteggio letture), non ArticleCard: una
            classifica va scansionata rapidamente riga per riga, non sfogliata
            come una griglia di copertine - stesso pattern già usato per
            "Articoli in coda di approvazione" nella Dashboard Manageriale
            (app/manager/page.tsx), qui riadattato a un ranking.
          */}
          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              I tuoi articoli più letti
            </h2>

            {piuLetti.length === 0 ? (
              <p className="text-sm text-fog">
                Nessun articolo pubblicato ancora: le letture compariranno qui una volta approvato il primo.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {piuLetti.map((articolo, i) => (
                  <Link
                    key={articolo.id}
                    href={`/articoli/${articolo.id}`}
                    className="flex items-center justify-between gap-4 border-b border-paper/10 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 font-heading text-sm font-bold text-fog">{i + 1}</span>
                      <span className="truncate text-sm text-paper">{articolo.titolo}</span>
                    </span>
                    <span className="shrink-0 text-xs text-fog">{articolo.numeroVisualizzazioni} letture</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
