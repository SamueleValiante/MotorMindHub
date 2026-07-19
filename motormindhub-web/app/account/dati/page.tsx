"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { requestDataExport } from "@/lib/auth/dataExport";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

// Il mockup 20 mostra anche righe "Articoli salvati" e "Consensi
// registrati": omesse qui, non finte. GestioneArticoli (salvataggi) non è
// ancora costruito, e il backend non conserva da nessuna parte una data
// di consenso privacy/cookie interrogabile (solo un booleano senza
// timestamp) — meglio ometterle che mostrare dati inventati.
export default function DatiPage() {
  const { user, loading } = useCurrentUser();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await requestDataExport();
    setExporting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area personale</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          I miei dati
        </h1>
      </div>

      <section className="max-w-2xl rounded-lg bg-carbon p-6">
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
          I dati che possediamo su di te
        </h2>
        <p className="mt-1 text-sm text-fog">
          In conformità con l&apos;Art. 15 del GDPR (diritto di accesso), qui trovi un riepilogo dei
          dati personali associati al tuo account.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-fog">Caricamento…</p>
        ) : user ? (
          <dl className="mt-6 divide-y divide-paper/10">
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <dt className="text-sm text-fog">Dati anagrafici</dt>
              <dd className="text-sm text-paper sm:text-right">
                Nome, cognome, email{user.fotoProfilo ? ", foto profilo" : ""}
                {user.biografia ? ", biografia" : ""}
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <dt className="text-sm text-fog">Data registrazione</dt>
              <dd className="text-sm font-semibold text-paper sm:text-right">
                {formatDate(user.dataRegistrazione)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-6 text-sm text-ember">Non è stato possibile caricare i tuoi dati.</p>
        )}
      </section>

      <section className="flex max-w-2xl flex-col gap-4 rounded-lg bg-carbon p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
            Esporta i tuoi dati
          </h2>
          <p className="mt-1 text-sm text-fog">
            Riceverai un&apos;email con un file JSON allegato, contenente una copia completa dei
            tuoi dati.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="shrink-0 rounded-md border border-chrome/40 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-60"
        >
          {exporting ? "Invio in corso…" : "Esporta dati"}
        </button>
      </section>
    </div>
  );
}
