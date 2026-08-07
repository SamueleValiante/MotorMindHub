"use client";

import { useState, type FormEvent } from "react";
import { inviteAuthor, type InviteAuthorInput } from "@/lib/autori/authorMutations";
import { toast } from "@/lib/toast/toast";
import { CloseIcon } from "@/components/public/icons";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent";
const labelClassName = "font-heading text-xs font-semibold uppercase tracking-wide text-fog";

interface InviteAuthorModalProps {
  onClose: () => void;
  onSent: () => void;
}

/**
 * Modale Invita un nuovo autore (mockup 31, RF3.3, UC_8). Testo "7 giorni"
 * per la validità del link: il valore reale è
 * GestioneAutori.SCADENZA_INVITO_GIORNI=7, non le "24 ore" del mockup né
 * l'"1 giorno" (sbagliato, riusa una costante generica) scritto nel corpo
 * dell'email inviata dal backend.
 */
export function InviteAuthorModal({ onClose, onSent }: InviteAuthorModalProps) {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [ruolo, setRuolo] = useState<InviteAuthorInput["ruolo"]>("AUTORE");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nome.trim() || !cognome.trim() || !email.trim()) {
      toast.error("Nome, cognome ed email sono obbligatori.");
      return;
    }

    setPending(true);
    const ok = await inviteAuthor({ nome: nome.trim(), cognome: cognome.trim(), email: email.trim(), ruolo });
    setPending(false);

    if (ok) onSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Invita un nuovo autore
            </h2>
            <p className="mt-1 text-sm text-fog">Verrà inviata un&apos;email con un link di attivazione valido 7 giorni.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="shrink-0 text-fog hover:text-paper">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="invito-nome" className={labelClassName}>
              Nome
            </label>
            <input
              id="invito-nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="invito-cognome" className={labelClassName}>
              Cognome
            </label>
            <input
              id="invito-cognome"
              type="text"
              value={cognome}
              onChange={(event) => setCognome(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="invito-email" className={labelClassName}>
              Email
            </label>
            <input
              id="invito-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="invito-ruolo" className={labelClassName}>
              Ruolo proposto
            </label>
            <select
              id="invito-ruolo"
              value={ruolo}
              onChange={(event) => setRuolo(event.target.value as InviteAuthorInput["ruolo"])}
              className={inputClassName}
            >
              <option value="AUTORE">Autore</option>
              <option value="MANAGER_AUTORI">Manager degli Autori</option>
            </select>
          </div>

          <div className="mt-2 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-heading text-sm font-bold uppercase tracking-wide text-chrome disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
            >
              {pending ? "Invio…" : "Invia invito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
