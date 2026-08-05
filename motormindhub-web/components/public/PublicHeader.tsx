"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/lib/auth/store";
import { UserMenu } from "./UserMenu";
import { BellIcon, MenuIcon, CloseIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/esplora", label: "Esplora" },
  { href: "/esplora", label: "Categorie" },
  { href: "/chi-siamo", label: "Chi Siamo" },
];

/**
 * Header pubblico condiviso (mockup 01/02/03): logo, nav, stato auth.
 * Nessuna ricerca in header nei mockup — la ricerca vive solo nell'hero
 * della Home e nei filtri di Esplora, non e' un elemento ricorrente da
 * riprodurre qui.
 *
 * La campanella (mockup 03/03b) e' decorativa: GestioneNotifiche non
 * espone una lista di notifiche in-app (solo invio email, SDD 4.6), quindi
 * niente dropdown/badge finti dietro un'icona che sembra funzionare.
 */
export function PublicHeader() {
  const status = useAuthStore((s) => s.status);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-paper/10 bg-asphalt">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-heading text-sm font-semibold uppercase tracking-wide text-chrome hover:text-amber"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {status === "authenticated" ? (
            <>
              <BellIcon className="h-5 w-5 text-chrome" aria-hidden="true" />
              <UserMenu />
            </>
          ) : status === "anonymous" ? (
            <>
              <Link href="/login" className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
                Accedi
              </Link>
              <Link
                href="/registrazione"
                className="rounded-md bg-amber px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
              >
                Registrati
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Chiudi menu" : "Apri menu"}
          className="text-chrome md:hidden"
        >
          {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-4 border-t border-paper/10 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-heading text-sm font-semibold uppercase tracking-wide text-chrome"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 border-t border-paper/10 pt-4">
            {status === "authenticated" ? (
              <UserMenu />
            ) : status === "anonymous" ? (
              <>
                <Link href="/login" className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
                  Accedi
                </Link>
                <Link
                  href="/registrazione"
                  className="rounded-md bg-amber px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
                >
                  Registrati
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
