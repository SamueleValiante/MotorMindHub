"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUsers } from "@/lib/amministrazioneUtenti/useUsers";
import { useReportsQueue } from "@/lib/amministrazioneUtenti/useReportsQueue";
import { useAdministrativeActionLog } from "@/lib/amministrazioneUtenti/useAdministrativeActionLog";
import { suspendAccount, reactivateAccount, exportUserDataAssisted } from "@/lib/amministrazioneUtenti/userMutations";
import { SuspendAccountModal } from "@/components/gestore/SuspendAccountModal";
import { ReactivateAccountModal } from "@/components/gestore/ReactivateAccountModal";
import { ExportSuccessModal } from "@/components/gestore/ExportSuccessModal";
import type { StatoSegnalazione, SuspensionInput, TipoAzioneAmministrativa } from "@/lib/amministrazioneUtenti/types";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

const STATO_SEGNALAZIONE_LABEL: Record<StatoSegnalazione, string> = {
  APERTA: "Aperta",
  IN_GESTIONE: "In gestione",
  ARCHIVIATA: "Archiviata",
};

const TIPO_AZIONE_LABEL: Record<TipoAzioneAmministrativa, string> = {
  SOSPENSIONE: "Sospensione",
  RIATTIVAZIONE: "Riattivazione",
  CANCELLAZIONE: "Cancellazione",
  ESPORTAZIONE: "Esportazione",
};

type Popup = "sospendi" | "riattiva" | "esporta-successo" | null;

/**
 * Scheda Utente (mockup 40, RF4.2) — solo GESTORE_UTENTI. Nessun endpoint di
 * dettaglio singolo: riusa la lista completa di searchUsers() e cerca per
 * id (stesso pattern del dettaglio segnalazione). Omessi "Articoli salvati"
 * e il countdown "giorni rimanenti" di sospensione: nessuna fonte dati per
 * nessuno dei due (verificato, non assunto).
 */
export default function SchedaUtentePage() {
  const params = useParams<{ userId: string }>();
  const parsedId = /^\d+$/.test(params.userId) ? Number(params.userId) : null;

  const users = useUsers();
  const reports = useReportsQueue();
  const log = useAdministrativeActionLog();

  const [popup, setPopup] = useState<Popup>(null);
  const [pending, setPending] = useState(false);
  const [exportEmail, setExportEmail] = useState("");

  if (users.status === "loading" || reports.status === "loading" || log.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }

  if (users.status === "error" || reports.status === "error" || log.status === "error" || parsedId === null) {
    return <p className="text-sm text-ember">Non è stato possibile caricare la scheda utente.</p>;
  }

  const utente = users.utenti.find((u) => u.id === parsedId);

  if (!utente) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">Utente non trovato</h1>
        <Link href="/gestore/gestione-account" className="font-heading text-sm font-bold uppercase text-amber">
          ← Torna a Gestione Account
        </Link>
      </div>
    );
  }

  const segnalazioniUtente = reports.segnalazioni.filter((s) => s.segnalatoId === utente.id);
  const cronologiaUtente = log.azioni.filter((a) => a.utenteTargetId === utente.id);

  const handleSospendi = async (dto: SuspensionInput) => {
    setPending(true);
    const ok = await suspendAccount(utente.id, dto);
    setPending(false);
    if (ok) {
      setPopup(null);
      users.refetch();
      log.refetch();
    }
  };

  const handleRiattiva = async () => {
    setPending(true);
    const ok = await reactivateAccount(utente.id);
    setPending(false);
    if (ok) {
      setPopup(null);
      users.refetch();
      log.refetch();
    }
  };

  const handleEsporta = async () => {
    setPending(true);
    const ok = await exportUserDataAssisted(utente.id);
    setPending(false);
    if (ok) {
      setExportEmail(utente.email);
      setPopup("esporta-successo");
      log.refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Scheda Utente
        </h1>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="h-16 w-16 shrink-0 rounded-full bg-surface-raised" />
          <div className="min-w-0">
            <h2 className="truncate font-heading text-lg font-bold text-paper">
              {utente.nome} {utente.cognome}
            </h2>
            <p className="truncate text-sm text-fog">{utente.email}</p>
          </div>
        </div>

        <dl className="mt-6 flex flex-col gap-3 border-t border-paper/10 pt-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-fog">Stato</dt>
            <dd className="text-paper" data-testid="utente-stato">{utente.stato}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fog">Iscritto dal</dt>
            <dd className="text-paper">{formatData(utente.dataRegistrazione)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fog">Segnalazioni ricevute</dt>
            <dd className="text-paper">{segnalazioniUtente.length}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          {utente.stato === "ATTIVO" && (
            <button
              type="button"
              onClick={() => setPopup("sospendi")}
              className="rounded-md bg-ember px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
            >
              Sospendi account
            </button>
          )}
          {utente.stato === "SOSPESO" && (
            <button
              type="button"
              onClick={() => setPopup("riattiva")}
              className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
            >
              Riattiva account
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleEsporta()}
            disabled={pending}
            className="rounded-md border border-paper/20 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {pending && popup === null ? "Esportazione…" : "Esporta dati utente"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-paper">Storico Segnalazioni</h2>

        {segnalazioniUtente.length === 0 ? (
          <p className="mt-4 text-sm text-fog">Nessuna segnalazione ricevuta.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                  <th className="py-2 pr-4 font-heading font-semibold">Motivazione</th>
                  <th className="py-2 pr-4 font-heading font-semibold">Data</th>
                  <th className="py-2 font-heading font-semibold">Stato</th>
                </tr>
              </thead>
              <tbody>
                {segnalazioniUtente.map((segnalazione) => (
                  <tr key={segnalazione.id} className="border-b border-paper/10 last:border-0">
                    <td className="py-3 pr-4 text-paper">{segnalazione.motivazione}</td>
                    <td className="py-3 pr-4 text-chrome">{formatData(segnalazione.dataCreazione)}</td>
                    <td className="py-3 text-chrome">{STATO_SEGNALAZIONE_LABEL[segnalazione.stato]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
          Cronologia Azioni Amministrative
        </h2>

        {cronologiaUtente.length === 0 ? (
          <p className="mt-4 text-sm text-fog">Nessuna azione amministrativa registrata.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {cronologiaUtente.map((azione, index) => (
              <div key={index} className="flex flex-col gap-1 border-b border-paper/10 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-paper">
                  {TIPO_AZIONE_LABEL[azione.tipoAzione]}
                  {azione.dettaglio ? ` — ${azione.dettaglio}` : ""}
                </span>
                <span className="text-xs text-fog">{formatData(azione.dataAzione)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {popup === "sospendi" && (
        <SuspendAccountModal
          targetNome={`${utente.nome} ${utente.cognome}`}
          pending={pending}
          onCancel={() => setPopup(null)}
          onConfirm={(dto) => void handleSospendi(dto)}
        />
      )}

      {popup === "riattiva" && (
        <ReactivateAccountModal
          targetNome={`${utente.nome} ${utente.cognome}`}
          pending={pending}
          onCancel={() => setPopup(null)}
          onConfirm={() => void handleRiattiva()}
        />
      )}

      {popup === "esporta-successo" && (
        <ExportSuccessModal
          targetNome={`${utente.nome} ${utente.cognome}`}
          targetEmail={exportEmail}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
