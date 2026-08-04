import Link from "next/link";
import type { ReactNode } from "react";
import { ClockIcon } from "./icons";
import type { ArticleSummary } from "@/lib/articoli/types";

interface ArticleCardProps {
  articolo: ArticleSummary;
  /** Slot opzionale sopra la copertina, fuori dal Link (es. rimuovi dai salvataggi in I Miei Salvataggi): un bottone non può annidarsi dentro un <a>. */
  action?: ReactNode;
  /** Slot opzionale sotto i metadati (es. pill "Preferiti"/"Leggi più tardi" in I Miei Salvataggi, o StatoBadge in Dashboard Autore). */
  badge?: ReactNode;
  /**
   * Di default il titolo/copertina linkano a /articoli/{id} (il dettaglio
   * pubblico). getArticleById non filtra per stato (nessun @PreAuthorize,
   * verificato sul backend): una bozza o un articolo in attesa sarebbe
   * comunque raggiungibile lì, ma non è la sua destinazione reale finché
   * l'Editor (punto 8) non esiste — false qui per bozze/in revisione/
   * rifiutati mostrati nella Dashboard Autore, evita di mandare l'autore
   * sulla pagina di lettura pubblica per un contenuto che non lo è ancora.
   */
  linkable?: boolean;
}

const cardContentClassName = "flex flex-col gap-3";

/**
 * `muted`: usato dalla variante non-linkable sotto invece di un wrapper
 * `opacity-60` — l'opacita' riduceva il contrasto effettivo di fog ben
 * sotto soglia WCAG (verificato in audit: 2.09:1, il peggiore trovato sul
 * sito), indipendentemente da quanto fosse corretto il colore base.
 * text-fog-disabled e' un colore dedicato pensato per restare conforme
 * anche qui, non fog attenuato via opacita' - cfr. docs/DESIGN_SYSTEM.md.
 */
function ArticleCardContent({ articolo, muted = false }: { articolo: ArticleSummary; muted?: boolean }) {
  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-md bg-surface-raised">
        {articolo.immagineCopertina && (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore, non ottimizzabile da next/image senza un dominio remoto configurato
          <img
            src={articolo.immagineCopertina}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <span className="inline-block w-fit rounded border border-chrome/40 px-2 py-1 font-heading text-xs uppercase tracking-wide text-chrome">
        {articolo.categoriaNome}
      </span>

      <div>
        <h3 className="font-heading text-lg font-bold text-paper">{articolo.titolo}</h3>
        {articolo.estratto && (
          <p className={`mt-1 line-clamp-2 text-sm ${muted ? "text-fog-disabled" : "text-fog"}`}>
            {articolo.estratto}
          </p>
        )}
      </div>

      <div className={`flex items-center gap-2 text-xs ${muted ? "text-fog-disabled" : "text-fog"}`}>
        <span>{articolo.autoreNome}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          {articolo.tempoLetturaMinuti} min
        </span>
      </div>
    </>
  );
}

/**
 * Card articolo condivisa (mockup 01/02/03, riusata anche da I Miei
 * Salvataggi e Dashboard Autore). Nessun upload copertina lato backend
 * (immagineCopertina e' solo una stringa su ArticleSummaryDTO, come
 * fotoProfilo su Utente): se assente, placeholder pieno invece di
 * un'immagine finta, stessa disciplina di Avatar.
 */
const NON_LINKABLE_REASON = "Anteprima non disponibile prima della pubblicazione";

export function ArticleCard({ articolo, action, badge, linkable = true }: ArticleCardProps) {
  return (
    <div className="relative flex flex-col gap-3 border-b border-paper/10 pb-6 last:border-0 last:pb-0">
      {linkable ? (
        <Link href={`/articoli/${articolo.id}`} className={cardContentClassName}>
          <ArticleCardContent articolo={articolo} />
        </Link>
      ) : (
        // cursor-default + title: senza un segnale esplicito, una card
        // identica alle altre ma non cliccabile sembra semplicemente
        // rotta, non intenzionalmente non interattiva. Non piu' un
        // wrapper opacity-60 (rompeva il contrasto del testo fog al suo
        // interno, cfr. ArticleCardContent): il testo muted usa un colore
        // dedicato invece, l'assenza di dimming generale sull'immagine/
        // badge e' compensata dal cursor-default + tooltip + etichetta sotto.
        <div className={`${cardContentClassName} cursor-default`} title={NON_LINKABLE_REASON}>
          <ArticleCardContent articolo={articolo} muted />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {badge}
        {!linkable && <span className="text-xs text-fog">{NON_LINKABLE_REASON}</span>}
      </div>
      {action && <div className="absolute right-0 top-0">{action}</div>}
    </div>
  );
}
