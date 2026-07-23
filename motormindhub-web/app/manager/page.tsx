"use client";

import Link from "next/link";
import { useManagerDashboardStats } from "@/lib/autori/useManagerDashboardStats";

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
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-amber">{state.stats.articoliPubblicati}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Articoli pubblicati</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-ember">{state.stats.inAttesaApprovazione}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">In attesa di approvazione</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">{state.stats.autoriAttivi}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Autori attivi</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">{state.stats.categorieTotali}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Categorie totali</p>
            </div>
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

            <Link href="/manager/articoli-in-attesa" className="font-heading text-sm font-bold uppercase text-amber">
              Vedi tutti →
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
