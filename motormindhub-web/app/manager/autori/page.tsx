"use client";

import { useState } from "react";
import { useAuthors } from "@/lib/autori/useAuthors";
import { AuthorTable } from "@/components/autori/AuthorTable";
import { InviteAuthorModal } from "@/components/autori/InviteAuthorModal";
import { RemoveAuthorModal } from "@/components/autori/RemoveAuthorModal";
import type { AuthorSummary } from "@/lib/autori/types";

/** Gestione Autori (mockup 30, RF3.2). */
export default function GestioneAutoriPage() {
  const autori = useAuthors();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<AuthorSummary | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
            Gestione Autori
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="shrink-0 rounded-md bg-accent px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          + Nuovo autore
        </button>
      </div>

      {autori.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : autori.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare gli autori.</p>
      ) : (
        <AuthorTable autori={autori.autori} onRemove={setPendingRemove} />
      )}

      {inviteOpen && (
        // Nessun autori.refetch() qui: inviteAuthor crea un InvitoAutore, non
        // un Utente — listAuthors() non cambierà finché l'invitato non
        // accetterà l'invito (lib/autori/useAuthors.ts).
        <InviteAuthorModal onClose={() => setInviteOpen(false)} onSent={() => setInviteOpen(false)} />
      )}

      {pendingRemove && (
        <RemoveAuthorModal
          autore={pendingRemove}
          onCancel={() => setPendingRemove(null)}
          onRemoved={() => {
            setPendingRemove(null);
            autori.refetch();
          }}
        />
      )}
    </div>
  );
}
