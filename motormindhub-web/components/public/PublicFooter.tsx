"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";

const SUPPORTO_EMAIL = "supporto@motormindhub.it";

/**
 * Footer pubblico condiviso (mockup 01). Le colonne "Piattaforma" e
 * "Legale" puntano a pagine reali gia' referenziate altrove (/termini in
 * registrazione/page.tsx, /cookie-policy nel CookieBanner, /informativa-privacy
 * anch'essa in registrazione/page.tsx — checkbox di consenso RNF5.1).
 *
 * Nessuna voce "Categorie": puntava a /esplora, stessa destinazione di
 * "Esplora articoli" con lo stesso filtro categoria già integrato — un
 * secondo link identico non aggiungeva nulla, rimosso (qui e nell'header).
 *
 * "Diventa autore" rimosso (era un link morto, cfr. /diventa-autore prima
 * di questa modifica): nel dominio (RAD, UC_8/9/10) diventare autore è solo
 * su invito del Manager Autori, nessun flusso di candidatura self-service
 * esiste da collegare.
 *
 * "Segnala un problema" e "Contatti" vanno a un mailto: nessun endpoint di
 * contatto/bug-report esiste nel backend, un link che apre il client di
 * posta e' l'unica cosa che questa voce puo' onestamente fare oggi.
 * "Linee guida editoriali" del mockup e' stata omessa: non corrisponde a
 * nessun contenuto ne' previsto dal RAD, un link a una pagina che non e'
 * nemmeno in programma sarebbe diverso da un "non ancora costruito".
 *
 * "Preferenze cookie": la Cookie Policy promette questo link, e
 * useCookieConsentStore.openPreferences() esiste gia' apposta (commento
 * "non ancora implementato" nello store) — collegarlo qui rende vera la
 * promessa del testo invece di lasciarla scoperta.
 */
export function PublicFooter() {
  const openPreferences = useCookieConsentStore((s) => s.openPreferences);

  return (
    <footer className="border-t border-paper/10 bg-asphalt">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-fog">
            L&apos;hub tecnico che centralizza la conoscenza automotive: dalla manutenzione di
            base alle specifiche ad alta granularità, per neofiti e professionisti.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-fog">
            Piattaforma
          </h3>
          <Link href="/esplora" className="text-sm text-chrome hover:text-amber">
            Esplora articoli
          </Link>
          <Link href="/chi-siamo" className="text-sm text-chrome hover:text-amber">
            Chi siamo
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-fog">
            Legale
          </h3>
          <Link href="/termini" className="text-sm text-chrome hover:text-amber">
            Termini e Condizioni
          </Link>
          <Link href="/cookie-policy" className="text-sm text-chrome hover:text-amber">
            Cookie Policy
          </Link>
          <Link href="/informativa-privacy" className="text-sm text-chrome hover:text-amber">
            Informativa Privacy
          </Link>
          <Link href="/accessibilita" className="text-sm text-chrome hover:text-amber">
            Accessibilità
          </Link>
          <button
            type="button"
            onClick={openPreferences}
            className="text-left text-sm text-chrome hover:text-amber"
          >
            Preferenze cookie
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-fog">
            Community
          </h3>
          <a href={`mailto:${SUPPORTO_EMAIL}`} className="text-sm text-chrome hover:text-amber">
            Segnala un problema
          </a>
          <a href={`mailto:${SUPPORTO_EMAIL}`} className="text-sm text-chrome hover:text-amber">
            Contatti
          </a>
        </div>
      </div>

      <div className="border-t border-paper/10 px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-6xl text-xs text-fog">
          © {new Date().getFullYear()} MotorMindHub — Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}
