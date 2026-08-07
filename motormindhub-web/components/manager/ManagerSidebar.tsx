"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { logout } from "@/lib/auth/logout";
import { HouseIcon, LogoutIcon, PersonIcon } from "@/components/account/icons";
import { DocumentIcon, LayersIcon } from "@/components/autore/icons";
import { PeopleIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/manager", label: "Dashboard", Icon: HouseIcon },
  { href: "/manager/autori", label: "Gestione Autori", Icon: PeopleIcon },
  { href: "/manager/categorie", label: "Gestione Categorie", Icon: LayersIcon },
  { href: "/manager/articoli-in-attesa", label: "Articoli in Attesa", Icon: DocumentIcon },
  { href: "/manager/impostazioni", label: "Impostazioni Profilo", Icon: PersonIcon },
];

/**
 * Sidebar condivisa dell'area Manager Autori (mockup 29/34/35/36/37), stesso
 * pattern di AutoreSidebar. Solo "Gestione Categorie" punta a una rotta
 * costruita in questa sessione — Dashboard/Gestione Autori/Articoli in
 * Attesa restano link non ancora raggiungibili (stesso trattamento già
 * usato da AutoreSidebar per "Categorie" prima che esistesse).
 *
 * Mobile-first: sotto md diventa una topbar compatta a icone.
 */
export function ManagerSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-paper/10 bg-carbon md:flex">
        <div className="px-6 py-6">
          <Link href="/manager">
            <Logo className="h-14 w-14" />
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
                    ? "border-accent bg-paper/5 text-accent"
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
            className="shrink-0 text-chrome hover:text-accent"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-paper/10 bg-carbon px-4 py-3 md:hidden">
        <Link href="/manager">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`rounded-md p-2 ${isActive ? "text-accent" : "text-chrome"}`}
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
