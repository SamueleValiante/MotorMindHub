"use client";

import { useState } from "react";
import { requestAccountDeletion } from "@/lib/auth/accountDeletion";
import { WarningIcon } from "@/components/account/icons";

export default function EliminaAccountPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    const ok = await requestAccountDeletion();
    setSubmitting(false);
    if (ok) {
      setRequested(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area personale</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Elimina account
        </h1>
      </div>

      {requested ? (
        // Nessun logout automatico: verificato nel codice che la richiesta
        // non tocca lo stato della sessione (RichiestaCancellazione viene
        // solo accodata, l'account resta ATTIVO) - forzare un logout qui
        // darebbe l'impressione di un effetto immediato che non c'è.
        <div className="max-w-2xl rounded-lg border border-success/40 bg-carbon p-6">
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
            Richiesta presa in carico
          </h2>
          <p className="mt-2 text-sm text-fog">
            Il tuo account resta attivo e utilizzabile normalmente mentre la richiesta viene
            elaborata (entro 30 giorni, Art. 17 GDPR). Riceverai un&apos;email di conferma al
            termine dell&apos;elaborazione: non è necessaria nessun&apos;altra azione da parte tua
            nel frattempo.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl rounded-lg border border-ember/50 bg-carbon p-6">
          <WarningIcon className="h-6 w-6 text-ember" />
          <h2 className="mt-3 font-heading text-lg font-bold text-paper">Elimina il tuo account</h2>
          <p className="mt-3 text-sm text-fog">
            Questa azione è irreversibile. Tutti i tuoi dati personali, articoli salvati e
            preferenze verranno eliminati o anonimizzati entro 30 giorni, in conformità con il
            diritto all&apos;oblio (Art. 17 GDPR). Riceverai un&apos;email di conferma al termine
            dell&apos;elaborazione — fino a quel momento il tuo account resta attivo e
            utilizzabile normalmente.
          </p>

          <label className="mt-4 flex items-start gap-3 text-sm text-chrome">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-ember"
            />
            Ho compreso che l&apos;operazione è irreversibile e desidero procedere con la
            cancellazione del mio account.
          </label>

          <button
            type="button"
            disabled={!confirmed || submitting}
            onClick={handleDelete}
            className="mt-4 rounded-md border border-ember px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-ember disabled:opacity-40"
          >
            {submitting ? "Invio in corso…" : "Elimina definitivamente il mio account"}
          </button>
        </div>
      )}
    </div>
  );
}
