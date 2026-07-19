"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/shared/Avatar";
import { ReportButton } from "@/components/report/ReportButton";
import { FlagIcon } from "@/components/report/icons";
import { usePublicProfile } from "@/lib/utenti/usePublicProfile";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Nessun mockup dedicato (i 51 mockup non coprono un profilo pubblico):
 * layout progettato seguendo DESIGN_SYSTEM.md e lo stile delle pagine
 * account già costruite. Solo i campi di PublicProfileDTO (id, nome,
 * cognome, fotoProfilo, biografia) — niente email/ruolo/data
 * registrazione, non esposti da questo endpoint per design (RF1.9).
 *
 * Non ancora raggiungibile da alcun punto di navigazione reale (nessuna
 * pagina articolo/autore esiste ancora, cfr. GestioneArticoli): per ora è
 * una route diretta /utenti/[userId], che diventerà il target di un link
 * "nome autore" quando quella pagina esisterà.
 */
export function PublicProfileContent({ userId }: { userId: string }) {
  const parsedId = /^\d+$/.test(userId) ? Number(userId) : null;
  const state = usePublicProfile(parsedId);
  const ownUid = useAuthStore((s) => s.uid);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <Logo />

      {state.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : state.status === "not-found" ? (
        <div className="rounded-lg bg-carbon p-6">
          <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">
            Profilo non trovato
          </h1>
          <p className="mt-2 text-sm text-fog">
            Questo utente non esiste o il profilo non è più disponibile.
          </p>
        </div>
      ) : (
        <section className="rounded-lg bg-carbon p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <Avatar
              nome={state.profile.nome}
              cognome={state.profile.cognome}
              fotoProfilo={state.profile.fotoProfilo}
              className="h-20 w-20 text-xl"
            />
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
                {state.profile.nome} {state.profile.cognome}
              </h1>
            </div>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-sm text-chrome">
            {state.profile.biografia || "Questo utente non ha ancora scritto una biografia."}
          </p>

          {ownUid !== state.profile.id && (
            <div className="mt-8 border-t border-paper/10 pt-6">
              <ReportButton
                segnalatoId={state.profile.id}
                segnalatoNome={`${state.profile.nome} ${state.profile.cognome}`}
                className="flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-fog hover:text-ember"
              >
                <FlagIcon className="h-4 w-4" />
                Segnala profilo
              </ReportButton>
            </div>
          )}
        </section>
      )}

      <Link href="/" className="font-heading text-xs uppercase tracking-wide text-fog">
        ← Torna alla home
      </Link>
    </div>
  );
}
