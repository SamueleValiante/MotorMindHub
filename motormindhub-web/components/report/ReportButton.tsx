"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { openReportModal } from "@/lib/report/store";
import type { ReactNode } from "react";

interface ReportButtonProps {
  segnalatoId: number;
  segnalatoNome?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Punto d'ingresso riusabile per la segnalazione: da profilo pubblico oggi,
 * in futuro da articoli/commenti se mai esisteranno — basta passare
 * segnalatoId. Incapsula anche il controllo di autenticazione (RF1.9:
 * solo utenti registrati): un guest viene mandato al login con un
 * redirect esplicito, non un modale che si apre per poi fallire in
 * silenzio al submit.
 *
 * Tre stati, non due: "loading" (bootstrap non ancora risolto, subito
 * dopo un reload completo della pagina) non è "anonymous". Un controllo
 * status !== "authenticated" tratterebbe "loading" come non autenticato,
 * rimandando al login un utente che in realtà lo è — bug reale trovato
 * verificando dal vivo, non solo un dettaglio dei test: un utente che
 * clicca "Segnala" nella finestra tra il caricamento della pagina e la
 * risoluzione del refresh silenzioso lo avrebbe incontrato. Il bottone
 * resta disabilitato in quella finestra, coerente con come RoleGuard
 * gestisce lo stesso stato.
 */
export function ReportButton({
  segnalatoId,
  segnalatoNome,
  className,
  children,
}: ReportButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);

  const handleClick = () => {
    if (status === "anonymous") {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }
    openReportModal(segnalatoId, segnalatoNome);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className={className}
    >
      {children ?? "Segnala"}
    </button>
  );
}
