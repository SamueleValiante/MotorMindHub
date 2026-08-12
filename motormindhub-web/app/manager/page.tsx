"use client";

import Link from "next/link";
import { useManagerDashboardStats } from "@/lib/autori/useManagerDashboardStats";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { StatCard } from "@/components/shared/StatCard";

const PIU_LETTI_COUNT = 5;

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

/**
 * Dashboard Manageriale (mockup 29, RF3.1). Il grafico "Andamento visite
 * (30 giorni)" del mockup non è renderizzato: ManagerDashboardStatsDTO non
 * lo include (nessun tracciamento visualizzazioni per data nel modello,
 * commento esplicito in GestioneAutori.getManagerDashboardStats) — dato
 * finto sarebbe peggio di nessun grafico.
 */
export default function ManagerDashboardPage() {
  const state = useManagerDashboardStats();
  // searchArticles (GET /api/v1/articoli, pubblico, RF1.1/1.2): restituisce
  // solo PUBBLICATO (cercaPubblicati lato repository) e supporta già
  // ordinamento=PIU_LETTI, lo stesso usato da Esplora Articoli - nessun
  // parametro nuovo da aggiungere lato backend. Vista dell'INTERA
  // piattaforma (nessun filtro autore/categoria), coerente con le altre
  // statistiche di questa dashboard che sono già globali, non del singolo
  // Manager. Un filtro per autore sarebbe utile ma richiederebbe un nuovo
  // parametro lato searchArticles (SearchCriteriaDTO non ha autoreId) -
  // fuori scope qui: la vista aggregata risponde già alla domanda "cosa
  // funziona meglio sulla piattaforma", il dettaglio per singolo autore
  // resta comunque raggiungibile da Gestione Autori.
  const piuLettiState = useArticleSearch({ ordinamento: "PIU_LETTI", dimensionePagina: PIU_LETTI_COUNT });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Dashboard Manageriale
        </h1>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare le statistiche.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <StatCard value={state.stats.articoliPubblicati} label="Articoli pubblicati" variant="accent" />
            <StatCard value={state.stats.inAttesaApprovazione} label="In attesa di approvazione" variant="critical" />
            <StatCard value={state.stats.autoriAttivi} label="Autori attivi" />
            <StatCard value={state.stats.categorieTotali} label="Categorie totali" />
          </div>

          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Articoli in coda di approvazione
            </h2>

            {state.stats.articoliInCoda.length === 0 ? (
              <p className="text-sm text-fog">Nessun articolo in attesa di approvazione.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {state.stats.articoliInCoda.map((articolo) => (
                  <Link
                    key={articolo.id}
                    href={`/manager/articoli-in-attesa/${articolo.id}`}
                    className="flex flex-col gap-1 border-b border-paper/10 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm text-paper">{articolo.titolo}</span>
                    <span className="text-xs text-fog">
                      {articolo.autoreNome} · {formatData(articolo.dataInvio)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/manager/articoli-in-attesa" className="font-heading text-sm font-bold uppercase text-accent">
              Vedi tutti →
            </Link>
          </section>

          {/*
            Lista compatta (titolo + autore + conteggio letture), non
            ArticleCard: stesso principio della sezione "in coda" sopra -
            qui con autoreNome, utile a un Manager per capire a colpo
            d'occhio CHI ha scritto i pezzi con più successo, non solo
            quali.
          */}
          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Articoli più letti
            </h2>

            {piuLettiState.status === "loading" ? (
              <p className="text-sm text-fog">Caricamento…</p>
            ) : piuLettiState.status === "error" ? (
              <p className="text-sm text-ember">Non è stato possibile caricare gli articoli più letti.</p>
            ) : piuLettiState.result.articoli.length === 0 ? (
              <p className="text-sm text-fog">Nessun articolo pubblicato ancora.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {piuLettiState.result.articoli.map((articolo, i) => (
                  <Link
                    key={articolo.id}
                    href={`/articoli/${articolo.id}`}
                    className="flex items-center justify-between gap-4 border-b border-paper/10 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 font-heading text-sm font-bold text-fog">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-paper">{articolo.titolo}</span>
                        <span className="text-xs text-fog">{articolo.autoreNome}</span>
                      </span>
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
