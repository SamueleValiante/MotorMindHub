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
        aria-label={`${user.nome} ${user.cognome}`}
      >
        {/*
          Il nome accessibile del bottone vive nell'aria-label sopra, non nel
          contenuto: l'Avatar è aria-hidden quando mostra le iniziali
          (fallback decorativo) e lo <span> col nome è nascosto sotto sm: -
          senza l'aria-label il bottone non aveva alcun nome discernibile su
          mobile (trovato da un audit axe reale, non per ispezione).
        */}
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
          {/*
            left-0 di base, right-0 solo da md in su: il trigger sta vicino
            al bordo SINISTRO nel pannello mobile (riga propria, allineato a
            inizio) ma vicino al bordo DESTRO nell'header desktop (ultimo
            elemento della riga) - ancorare sempre a destra (right-0, unico
            valore prima di questo fix) spinge il dropdown w-48 quasi
            interamente fuori dal viewport a sinistra sul pannello mobile,
            lasciando visibile solo un lembo vuoto del box: bug riprodotto
            con Playwright (boundingBox.x negativo, elementFromPoint nullo
            al centro delle voci). md:left-auto cancella left-0 prima che
            md:right-0 prenda effetto (left+right+width tutti espliciti
            sarebbero sovra-vincolati).
          */}
          <div className="absolute left-0 z-20 mt-2 w-48 rounded-md border border-paper/10 bg-carbon py-1 shadow-xl md:left-auto md:right-0">
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
