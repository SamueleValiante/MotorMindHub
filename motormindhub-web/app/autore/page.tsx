"use client";

import Link from "next/link";
import { useMyArticles } from "@/lib/articoli/useMyArticles";
import { ArticleCard } from "@/components/public/ArticleCard";
import { StatoBadge } from "@/components/articoli/StatoBadge";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { DocumentIcon } from "@/components/autore/icons";

const ULTIMI_ARTICOLI_COUNT = 4;

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
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-accent">{pubblicati}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Articoli pubblicati</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">{inRevisione}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">In attesa di approvazione</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">{bozze}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Bozze salvate</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">{lettureTotali}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Letture totali</p>
            </div>
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
              <div className="flex flex-col gap-6">
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
        </>
      )}
    </div>
  );
}
