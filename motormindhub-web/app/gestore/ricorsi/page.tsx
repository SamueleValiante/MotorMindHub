"use client";

import Link from "next/link";
import { useUsers } from "@/lib/amministrazioneUtenti/useUsers";
import { useAdministrativeActionLog } from "@/lib/amministrazioneUtenti/useAdministrativeActionLog";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { ShieldDataIcon } from "@/components/account/icons";
import type { UserSummary } from "@/lib/amministrazioneUtenti/types";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

/**
 * Ultima voce SOSPENSIONE per l'utente (ordine di arrivo dell'API non
 * garantito: si confronta dataAzione invece di prendere il primo match).
 * Nessun campo "Ricorso ricevuto" (mockup 42): il RAD (3.4.1.23) descrive il
 * ricorso come inviato fuori piattaforma ("scrive a MotorMindHub"), nessun
 * endpoint lo traccia — non è un'omissione, è come il dominio è modellato.
 */
function ultimaSospensione(azioni: ReturnType<typeof useAdministrativeActionLog>, utenteId: number) {
  if (azioni.status !== "ready") return null;
  return azioni.azioni
    .filter((a) => a.utenteTargetId === utenteId && a.tipoAzione === "SOSPENSIONE")
    .sort((a, b) => new Date(b.dataAzione).getTime() - new Date(a.dataAzione).getTime())[0] ?? null;
}

/** Ricorsi (mockup 42, RF4.3, UC_24) — solo GESTORE_UTENTI. */
export default function RicorsiPage() {
  const users = useUsers();
  const log = useAdministrativeActionLog();

  const loading = users.status === "loading" || log.status === "loading";
  const error = users.status === "error" || log.status === "error";

  const sospesi: UserSummary[] = users.status === "ready" ? users.utenti.filter((u) => u.stato === "SOSPESO") : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">Ricorsi</h1>
      </div>

      {loading ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : error ? (
        <p className="text-sm text-ember">Non è stato possibile caricare i ricorsi.</p>
      ) : sospesi.length === 0 ? (
        <EmptyState
          icon={<ShieldDataIcon className="h-6 w-6" />}
          title="Nessun ricorso in attesa"
          description="Gli account sospesi che possono presentare ricorso compariranno qui."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Utente</th>
                <th className="px-6 py-4 font-heading font-semibold">Sospeso il</th>
                <th className="px-6 py-4 font-heading font-semibold">Motivazione Sospensione</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {sospesi.map((utente) => {
                const sospensione = ultimaSospensione(log, utente.id);
                return (
                  <tr key={utente.id} className="border-b border-paper/10 last:border-0">
                    <td className="px-6 py-4">
                      <p className="text-paper">
                        {utente.nome} {utente.cognome}
                      </p>
                      <p className="text-xs text-fog">{utente.email}</p>
                    </td>
                    <td className="px-6 py-4 text-chrome">
                      {sospensione ? formatData(sospensione.dataAzione) : "—"}
                    </td>
                    <td className="px-6 py-4 text-chrome">{sospensione?.dettaglio ?? "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/gestore/gestione-account/${utente.id}`}
                          className="rounded-md border border-paper/20 px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-paper"
                        >
                          Valuta Ricorso
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
