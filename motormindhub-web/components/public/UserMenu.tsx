"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { logout } from "@/lib/auth/logout";
import { Avatar } from "@/components/shared/Avatar";
import { ChevronDownIcon } from "./icons";

/**
 * Chip utente autenticato dell'header pubblico (mockup 03/03b, "MARCO V. ⌄"):
 * il menu a tendina ha solo due voci reali (Area personale, Esci), non
 * un menu notifiche/impostazioni inventato — GestioneNotifiche non espone
 * una lista in-app (solo email, SDD 4.6), niente da mostrare li' dentro.
 */
export function UserMenu() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-paper"
        aria-expanded={open}
      >
        <Avatar nome={user.nome} cognome={user.cognome} fotoProfilo={user.fotoProfilo} className="h-8 w-8 text-xs" />
        <span className="hidden font-heading uppercase tracking-wide sm:inline">
          {user.nome} {user.cognome.charAt(0)}.
        </span>
        <ChevronDownIcon className="h-4 w-4 text-chrome" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-paper/10 bg-carbon py-1 shadow-xl">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-paper hover:bg-paper/5"
            >
              Area personale
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="block w-full px-4 py-2 text-left text-sm text-paper hover:bg-paper/5"
            >
              Esci
            </button>
          </div>
        </>
      )}
    </div>
  );
}
