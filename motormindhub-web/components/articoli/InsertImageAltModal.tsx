"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/autore/icons";
import { useFocusTrap } from "@/lib/shared/useFocusTrap";

interface InsertImageAltModalProps {
  imageUrl: string;
  onConfirm: (alt: string) => void;
  onCancel: () => void;
}

/**
 * Testo alternativo obbligatorio prima di inserire un'immagine caricata nel
 * corpo dell'articolo (WCAG 1.1.1): l'upload (uploadInlineImage) è già
 * avvenuto quando questo modale si apre, qui si decide solo se e con quale
 * alt inserirla nel documento — annullare non cancella il file dal
 * server, stesso comportamento di un upload di copertina mai salvato.
 */
export function InsertImageAltModal({ imageUrl, onConfirm, onCancel }: InsertImageAltModalProps) {
  const [alt, setAlt] = useState("");
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen: true, onClose: onCancel });

  const trimmed = alt.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inserisci-immagine-title"
        className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <ImageIcon className="h-5 w-5" />
        </div>

        <h2
          id="inserisci-immagine-title"
          tabIndex={-1}
          data-focus-trap-initial
          className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper outline-none"
        >
          Descrivi l&apos;immagine
        </h2>
        <p className="mt-2 text-sm text-fog">
          Un breve testo alternativo è obbligatorio: descrive l&apos;immagine a chi usa uno screen
          reader o non riesce a vederla.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element -- anteprima di un URL Cloudinary appena caricato, stesso pattern di ImageUploadField */}
        <img src={imageUrl} alt="" className="mt-4 aspect-video w-full rounded-md object-cover" />

        <form onSubmit={handleSubmit}>
          <label htmlFor="immagine-alt" className="mt-4 block font-heading text-xs font-semibold uppercase tracking-wide text-fog">
            Testo alternativo
          </label>
          <input
            id="immagine-alt"
            type="text"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Es. Schema del sistema frenante ABS"
            className="mt-2 w-full rounded-md bg-surface-raised px-4 py-3 text-sm text-paper outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!trimmed}
              className="rounded-md bg-accent px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
            >
              Inserisci
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
