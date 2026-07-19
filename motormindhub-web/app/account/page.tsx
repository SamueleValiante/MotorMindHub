"use client";

import Link from "next/link";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { Avatar } from "@/components/shared/Avatar";

function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
}

// Il mockup 15 mostra anche "Articoli salvati", "Leggi più tardi" e una
// tabella "Ultimi salvataggi": omessi qui, non finti. Dipendono dai dati
// di GestioneArticoli (salvataggi), non ancora costruito lato frontend —
// stessa disciplina già applicata in I Miei Dati (dati.tsx) e I Miei
// Salvataggi (rimandata per intero, cfr. MOCKUPS.md).
export default function PanoramicaPage() {
  const { user, loading } = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area personale</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          {loading ? "Ciao…" : user ? `Ciao, ${user.nome}` : "Ciao"}
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : !user ? (
        <p className="text-sm text-ember">Non è stato possibile caricare i tuoi dati.</p>
      ) : (
        <>
          <section className="max-w-xs rounded-lg bg-carbon p-6">
            <p className="font-heading text-3xl font-bold text-amber">
              {formatMonthYear(user.dataRegistrazione)}
            </p>
            <p className="mt-1 text-sm uppercase tracking-wide text-fog">Iscritto dal</p>
          </section>

          <section className="max-w-2xl rounded-lg bg-carbon p-6">
            <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
              Il tuo profilo
            </h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar nome={user.nome} cognome={user.cognome} fotoProfilo={user.fotoProfilo} />
                <div>
                  <p className="font-semibold text-paper">
                    {user.nome} {user.cognome}
                  </p>
                  <p className="text-sm text-fog">{user.email}</p>
                </div>
              </div>
              <Link
                href="/account/impostazioni"
                className="shrink-0 rounded-md border border-chrome/40 px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-paper"
              >
                Modifica profilo
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
