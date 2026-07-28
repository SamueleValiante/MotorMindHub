"use client";

import { useState } from "react";
import { ShieldDataIcon } from "@/components/account/icons";
import { MOTIVAZIONI_SOSPENSIONE, type MotivazioneSospensione, type SuspensionInput } from "@/lib/amministrazioneUtenti/types";

interface SuspendAccountModalProps {
  targetNome: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (dto: SuspensionInput) => void;
}

const DEFAULT_DURATA_GIORNI = 30;

/** Popup "Sospendi account" (mockup 41, RF4.3, UC_23) — riusato da "Scala a Sospensione" (mockup 45). */
export function SuspendAccountModal({ targetNome, pending, onCancel, onConfirm }: SuspendAccountModalProps) {
  const [motivazione, setMotivazione] = useState<MotivazioneSospensione>(MOTIVAZIONI_SOSPENSIONE[0].value);
  const [noteAggiuntive, setNoteAggiuntive] = useState("");
  const [permanente, setPermanente] = useState(false);
  const [durataGiorni, setDurataGiorni] = useState(String(DEFAULT_DURATA_GIORNI));

  const durataValida = permanente || (/^\d+$/.test(durataGiorni) && Number(durataGiorni) > 0);

  const handleConfirm = () => {
    if (!durataValida) return;
    onConfirm({
      motivazione,
      noteAggiuntive: noteAggiuntive.trim() || null,
      durataGiorni: permanente ? null : Number(durataGiorni),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <ShieldDataIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Sospendi l&apos;account di &quot;{targetNome}&quot;
        </h2>
        <p className="mt-2 text-sm text-fog">
          L&apos;utente riceverà un&apos;email con la motivazione e le modalità di ricorso.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="motivazione-sospensione" className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">
            Motivazione
          </label>
          <select
            id="motivazione-sospensione"
            value={motivazione}
            onChange={(event) => setMotivazione(event.target.value as MotivazioneSospensione)}
            className="rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber"
          >
            {MOTIVAZIONI_SOSPENSIONE.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {motivazione === "ALTRO" && (
          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="note-sospensione" className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">
              Note aggiuntive
            </label>
            <textarea
              id="note-sospensione"
              value={noteAggiuntive}
              onChange={(event) => setNoteAggiuntive(event.target.value)}
              rows={3}
              maxLength={1000}
              className="rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber"
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <label className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">
            Durata sospensione
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={durataGiorni}
              onChange={(event) => setDurataGiorni(event.target.value)}
              disabled={permanente}
              className="w-24 rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber disabled:opacity-50"
            />
            <span className="text-sm text-fog">Giorni</span>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-chrome">
              <input
                type="checkbox"
                checked={permanente}
                onChange={(event) => setPermanente(event.target.checked)}
                className="h-4 w-4 accent-amber"
              />
              Permanente
            </label>
          </div>
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
            onClick={handleConfirm}
            disabled={pending || !durataValida}
            className="rounded-md bg-ember px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {pending ? "Sospensione…" : "Conferma sospensione"}
          </button>
        </div>
      </div>
    </div>
  );
}
