"use client";

import { useState } from "react";
import { removeAuthor } from "@/lib/autori/authorMutations";
import { TrashIcon } from "@/components/account/icons";
import type { AuthorSummary } from "@/lib/autori/types";

interface RemoveAuthorModalProps {
  autore: AuthorSummary;
  onCancel: () => void;
  onRemoved: () => void;
}

/**
 * Popup Rimuovi Autore (mockup 32, RF3.4, UC_11): "Mantieni" (default) vs
 * "Elimina" gli articoli pregressi. Testo diverso dal mockup per
 * "Mantieni": GestioneAutori.removeAuthor non anonimizza nulla quando
 * mantieniArticoli=true — retrocede solo l'utente a ISCRITTO (nome/email
 * restano quelli reali), non tocca gli articoli. "Verranno anonimizzati"
 * del mockup non è quindi vero, non riproposto qui.
 */
export function RemoveAuthorModal({ autore, onCancel, onRemoved }: RemoveAuthorModalProps) {
  const [mantieniArticoli, setMantieniArticoli] = useState(true);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    const ok = await removeAuthor(autore.id, mantieniArticoli);
    setPending(false);
    if (ok) onRemoved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <TrashIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Rimuovere &quot;{autore.nome} {autore.cognome}&quot;?
        </h2>
        <p className="mt-2 text-sm text-fog">
          L&apos;autore perderà l&apos;accesso all&apos;area riservata. Scegli cosa fare con i{" "}
          {autore.numeroArticoli} articoli già pubblicati.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- falso
              positivo: la regola cerca testo accessibile fino a profondita' 2
              (default), qui il testo e' a profondita' 3 (label > span > span >
              testo). Il controllo e' annidato correttamente (implicit label,
              screen reader lo associa) e il testo c'e' davvero - verificato
              leggendo mayHaveAccessibleLabel.js della regola, non per assunzione. */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="policy-articoli"
              checked={mantieniArticoli}
              onChange={() => setMantieniArticoli(true)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span className="text-sm text-paper">
              <span className="font-semibold">Mantieni gli articoli</span>
              <span className="text-fog"> — resteranno pubblicati, l&apos;autore perde solo l&apos;accesso all&apos;area riservata</span>
            </span>
          </label>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- stesso falso positivo di sopra (testo a profondita' 3). */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="policy-articoli"
              checked={!mantieniArticoli}
              onChange={() => setMantieniArticoli(false)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span className="text-sm text-paper">
              <span className="font-semibold">Elimina gli articoli</span>
              <span className="text-fog"> — rimossi definitivamente dal portale</span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="font-heading text-sm font-bold uppercase tracking-wide text-chrome disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={pending}
            className="rounded-md bg-ember px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending ? "Rimozione…" : "Conferma rimozione"}
          </button>
        </div>
      </div>
    </div>
  );
}
