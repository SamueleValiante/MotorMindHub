"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { logout } from "@/lib/auth/logout";
import { HouseIcon, LogoutIcon, PersonIcon } from "@/components/account/icons";
import { DocumentIcon, PencilIcon, LayersIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/autore", label: "Dashboard", Icon: HouseIcon },
  { href: "/autore/articoli", label: "I Miei Articoli", Icon: DocumentIcon },
  { href: "/autore/bozze", label: "Le Mie Bozze", Icon: PencilIcon },
  { href: "/autore/categorie", label: "Categorie", Icon: LayersIcon },
  { href: "/account/impostazioni", label: "Impostazioni Profilo", Icon: PersonIcon },
];

/**
 * Sidebar condivisa dell'area Autore (mockup 21/22/23/24/25/27), stesso
 * pattern di AccountSidebar. "Categorie" punta a una rotta non ancora
 * costruita (GestioneCategorie è il sottosistema successivo): stesso
 * trattamento già in uso per i link non ancora raggiungibili altrove.
 *
 * Mobile-first: sotto md diventa una topbar compatta a icone.
 */
export function AutoreSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-paper/10 bg-carbon md:flex">
        <div className="px-6 py-6">
          <Logo />
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
        <Logo />
        <nav className="flex items-center gap-1">
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
