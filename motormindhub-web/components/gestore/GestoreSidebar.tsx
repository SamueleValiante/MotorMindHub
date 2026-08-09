"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/lib/auth/store";
import { logout } from "@/lib/auth/logout";
import { HouseIcon, LogoutIcon, ShieldDataIcon, TrashIcon } from "@/components/account/icons";
import { PeopleIcon } from "@/components/manager/icons";
import { FlagIcon } from "@/components/report/icons";
import { ClockIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/gestore", label: "Dashboard", Icon: HouseIcon },
  { href: "/gestore/gestione-account", label: "Gestione Account", Icon: PeopleIcon },
  { href: "/gestore/segnalazioni", label: "Coda Segnalazioni", Icon: FlagIcon },
  { href: "/gestore/ricorsi", label: "Ricorsi", Icon: ShieldDataIcon },
  { href: "/gestore/richieste-cancellazione", label: "Richieste Cancellazione", Icon: TrashIcon },
  { href: "/gestore/cronologia", label: "Cronologia Azioni", Icon: ClockIcon },
];

/**
 * Sidebar condivisa dell'area Gestore Utenti (mockup 44/45/48), stesso
 * pattern di ManagerSidebar. Solo "Coda Segnalazioni" punta a una rotta
 * costruita in questa sessione — le altre voci restano link non ancora
 * raggiungibili (stesso trattamento già usato da ManagerSidebar/AutoreSidebar
 * per le sezioni non ancora costruite).
 *
 * Mobile-first: sotto md diventa una topbar compatta a icone.
 */
export function GestoreSidebar() {
  const pathname = usePathname();
  // Non useCurrentUser() (GET /utenti/me): quell'endpoint esclude
  // deliberatamente GESTORE_UTENTI dai self-service (RAD 3.2.4,
  // SelfServiceAuthorizationIntegrationTest) — 403 garantito. L'unica
  // identità disponibile per questo ruolo è quella già decodificata dal JWT
  // nello store (email, ruolo), niente nome/cognome.
  const email = useAuthStore((s) => s.email);
  const ruolo = useAuthStore((s) => s.ruolo);

  return (
    <>
      {/* sticky top-0: senza, l'aside scorre via col resto della pagina su liste lunghe — stesso fix/motivo di AccountSidebar. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-paper/10 bg-carbon md:flex">
        <div className="px-6 py-6">
          <Link href="/gestore">
            <Logo className="h-14 w-14" />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
            <p className="truncate text-sm font-semibold text-paper">{email ?? "…"}</p>
            {ruolo && <p className="text-xs uppercase tracking-wide text-fog">{ruolo}</p>}
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
        <Link href="/gestore">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
