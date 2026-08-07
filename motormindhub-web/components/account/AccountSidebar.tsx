"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { logout } from "@/lib/auth/logout";
import {
  HouseIcon,
  PersonIcon,
  BookmarkIcon,
  ShieldDataIcon,
  TrashIcon,
  LogoutIcon,
  ArrowLeftIcon,
} from "./icons";

const NAV_ITEMS = [
  { href: "/account", label: "Panoramica", Icon: HouseIcon },
  { href: "/account/impostazioni", label: "Impostazioni Profilo", Icon: PersonIcon },
  { href: "/account/salvataggi", label: "I Miei Salvataggi", Icon: BookmarkIcon },
  { href: "/account/dati", label: "I Miei Dati", Icon: ShieldDataIcon },
  { href: "/account/elimina", label: "Elimina Account", Icon: TrashIcon },
];

/**
 * Sidebar condivisa dell'area account (mockup 15-20).
 *
 * Mobile-first: sotto md diventa una topbar compatta a icone (il mockup
 * mostra solo la variante desktop, una sidebar fissa a piena altezza non
 * ha senso su schermi stretti).
 */
export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-paper/10 bg-carbon md:flex">
        <div className="px-6 py-6">
          <Link href="/">
            <Logo className="h-14 w-14" />
          </Link>
        </div>

        <div className="border-b border-paper/10 px-3 pb-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 font-heading text-sm uppercase tracking-wide text-chrome hover:bg-paper/5 hover:text-amber"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" />
            Torna alla home
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 font-heading text-sm uppercase tracking-wide ${
                  isActive
                    ? "border-amber bg-paper/5 text-amber"
                    : "border-transparent text-chrome hover:bg-paper/5"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-paper/10 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-paper">
              {user ? `${user.nome} ${user.cognome}` : "…"}
            </p>
            {user && <p className="text-xs uppercase tracking-wide text-fog">{user.ruolo}</p>}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Esci"
            className="shrink-0 text-chrome hover:text-amber"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-paper/10 bg-carbon px-4 py-3 md:hidden">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/" aria-label="Torna alla home" className="rounded-md p-2 text-chrome">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`rounded-md p-2 ${isActive ? "text-amber" : "text-chrome"}`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Esci"
            className="rounded-md p-2 text-chrome"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </nav>
      </header>
    </>
  );
}
