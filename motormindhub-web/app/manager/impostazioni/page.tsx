"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ProfileSettingsForm } from "@/components/shared/ProfileSettingsForm";

/**
 * Stessa pagina/form di /account/impostazioni (ISCRITTO), montata dentro
 * app/manager/layout.tsx invece che app/account/layout.tsx: ManagerSidebar
 * resta visibile durante la navigazione, non viene sostituita da
 * AccountSidebar come accadrebbe raggiungendo /account/impostazioni da qui.
 */
export default function ImpostazioniProfiloManagerPage() {
  const { user, loading } = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area personale</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Impostazioni profilo
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : user ? (
        <ProfileSettingsForm user={user} redirectTo="/manager" />
      ) : (
        <p className="text-sm text-ember">Non è stato possibile caricare i tuoi dati.</p>
      )}
    </div>
  );
}
