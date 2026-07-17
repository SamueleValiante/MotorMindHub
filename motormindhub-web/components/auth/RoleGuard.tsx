"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import type { Ruolo } from "@/lib/auth/jwt";

interface RoleGuardProps {
  /** Ruoli ammessi a vedere il contenuto di questo gruppo di route. */
  allowedRoles: Ruolo[];
  children: React.ReactNode;
}

/**
 * Guardia riusabile per i layout dei gruppi protetti: (account), (autore),
 * (manager), (gestore). Il middleware ha già verificato solo la presenza
 * del cookie di sessione; qui si aspetta l'esito del bootstrap (chiamata
 * silenziosa a /auth/refresh in AuthProvider) e poi decide in base al
 * ruolo decodificato dall'access token.
 *
 * "loading" -> stato di attesa, nessun redirect, nessun contenuto protetto
 * renderizzato. "anonymous" -> redirect a /login. Ruolo non ammesso ->
 * redirect alla home. Altrimenti renderizza i children.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const ruolo = useAuthStore((s) => s.ruolo);

  const isAllowed = status === "authenticated" && !!ruolo && allowedRoles.includes(ruolo);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    } else if (status === "authenticated" && !isAllowed) {
      router.replace("/");
    }
  }, [status, isAllowed, router]);

  if (status === "loading") {
    // Placeholder minimale: sostituito da un componente condiviso quando
    // implementeremo Toast/empty state/loading (punto 3 del piano).
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-fog">Caricamento…</span>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}
