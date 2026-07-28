"use client";

import Link from "next/link";
import { useUserManagementDashboard } from "@/lib/amministrazioneUtenti/useUserManagementDashboard";
import { useUsers } from "@/lib/amministrazioneUtenti/useUsers";
import { useReportsQueue } from "@/lib/amministrazioneUtenti/useReportsQueue";
import { useDeletionRequestsQueue } from "@/lib/amministrazioneUtenti/useDeletionRequestsQueue";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

const ANTEPRIMA_MAX = 3;

/**
 * Dashboard Gestione Utenti (mockup 38, RF4.1, UC_22) — solo GESTORE_UTENTI.
 * getUserManagementDashboard() espone solo 3 contatori grezzi (nessuna
 * lista embedded, a differenza di ManagerDashboardStatsDTO): "Account
 * Sospesi" e le due anteprime sono derivati componendo gli altri tre hook
 * già cablati altrove in questo sottosistema, non da un endpoint dedicato.
 *
 * Omessi rispetto al mockup: il delta "+N questa settimana" (nessuna fonte
 * dati) e la colonna "Tipo: Esportazione" nell'anteprima GDPR — non esiste
 * una coda di richieste di esportazione lato Gestore (exportUserDataAssisted
 * è un'azione diretta avviata dalla Scheda Utente, non una richiesta che
 * l'utente mette in coda): l'unica coda GDPR reale è quella di cancellazione.
 */
export default function GestoreDashboardPage() {
  const dashboard = useUserManagementDashboard();
  const users = useUsers();
  const reports = useReportsQueue();
  const deletionQueue = useDeletionRequestsQueue();

  const loading =
    dashboard.status === "loading" ||
    users.status === "loading" ||
    reports.status === "loading" ||
    deletionQueue.status === "loading";
  const error =
    dashboard.status === "error" ||
    users.status === "error" ||
    reports.status === "error" ||
    deletionQueue.status === "error";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Dashboard Gestione Utenti
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : error || dashboard.status !== "ready" || users.status !== "ready" || reports.status !== "ready" || deletionQueue.status !== "ready" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare le statistiche.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-amber">{dashboard.stats.utentiRegistrati}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Utenti registrati</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-ember">{dashboard.stats.segnalazioniAperte}</p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Segnalazioni aperte</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">
                {dashboard.stats.richiesteCancellazioneInCoda}
              </p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Richieste di cancellazione</p>
            </div>
            <div className="rounded-lg bg-carbon p-6">
              <p className="font-heading text-3xl font-bold text-paper">
                {users.utenti.filter((u) => u.stato === "SOSPESO").length}
              </p>
              <p className="mt-1 text-sm uppercase tracking-wide text-fog">Account sospesi</p>
            </div>
          </div>

          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Segnalazioni recenti
            </h2>

            {reports.segnalazioni.length === 0 ? (
              <p className="text-sm text-fog">Nessuna segnalazione ricevuta.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {reports.segnalazioni.slice(0, ANTEPRIMA_MAX).map((segnalazione) => (
                  <div
                    key={segnalazione.id}
                    className="flex flex-col gap-1 border-b border-paper/10 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm text-paper">{segnalazione.segnalatoNome}</span>
                    <span className="text-xs text-fog">
                      {segnalazione.motivazione} · {formatData(segnalazione.dataCreazione)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/gestore/segnalazioni" className="font-heading text-sm font-bold uppercase text-amber">
              Vai alla coda →
            </Link>
          </section>

          <section className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Richieste GDPR in coda
            </h2>

            {deletionQueue.richieste.filter((r) => r.stato === "IN_CODA").length === 0 ? (
              <p className="text-sm text-fog">Nessuna richiesta di cancellazione in coda.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {deletionQueue.richieste
                  .filter((r) => r.stato === "IN_CODA")
                  .slice(0, ANTEPRIMA_MAX)
                  .map((richiesta) => (
                    <div
                      key={richiesta.id}
                      className="flex flex-col gap-1 border-b border-paper/10 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm text-paper">{richiesta.utenteNome}</span>
                      <span className="text-xs text-fog">
                        Cancellazione · {formatData(richiesta.dataRichiesta)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <Link
              href="/gestore/richieste-cancellazione"
              className="font-heading text-sm font-bold uppercase text-amber"
            >
              Vai alla coda →
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
