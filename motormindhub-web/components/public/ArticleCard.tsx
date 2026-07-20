import Link from "next/link";
import { ClockIcon } from "./icons";
import type { ArticleSummary } from "@/lib/articoli/types";

/**
 * Card articolo condivisa (mockup 01/02/03): riusata da Home, Esplora e in
 * futuro da I Miei Salvataggi. Nessun upload copertina lato backend
 * (immagineCopertina e' solo una stringa su ArticleSummaryDTO, come
 * fotoProfilo su Utente): se assente, placeholder pieno invece di
 * un'immagine finta, stessa disciplina di Avatar.
 */
export function ArticleCard({ articolo }: { articolo: ArticleSummary }) {
  return (
    <Link
      href={`/articoli/${articolo.id}`}
      className="flex flex-col gap-3 border-b border-paper/10 pb-6 last:border-0 last:pb-0"
    >
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
          <p className="mt-1 line-clamp-2 text-sm text-fog">{articolo.estratto}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-fog">
        <span>{articolo.autoreNome}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          {articolo.tempoLetturaMinuti} min
        </span>
      </div>
    </Link>
  );
}
