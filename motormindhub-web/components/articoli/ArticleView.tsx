import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import type { ArticleDetail } from "@/lib/articoli/types";
import { ArticleMarkdownBody } from "./ArticleMarkdownBody";
import { ArticleReferences } from "./ArticleReferences";

function initials(nomeCompleto: string): string {
  const parts = nomeCompleto.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

function formatAggiornato(iso: string): string {
  const date = new Date(iso);
  const oggi = new Date();
  const giorni = Math.floor((oggi.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86_400_000);
  if (giorni === 0) return "oggi";
  if (giorni === 1) return "ieri";
  return `il ${new Date(iso).toLocaleDateString("it-IT")}`;
}

/**
 * Vista articolo condivisa dalla pagina pubblica e dall'anteprima del
 * Manager (stessa colonna, stessa larghezza, stesso ordine: il Manager vede
 * esattamente ciò che vedrà il lettore). Colonna di lettura max-w-3xl,
 * copertina ad altezza limitata, riferimenti legali in calce.
 *
 * Ingresso: i blocchi emergono uno dopo l'altro (.mmh-rise, [--mmh-i:N]);
 * mmh-own-motion esclude l'articolo dalla cascata generica di pagina, che
 * altrimenti lo animerebbe una seconda volta come blocco unico.
 */
export function ArticleView({ articolo, actions }: { articolo: ArticleDetail; actions?: ReactNode }) {
  return (
    <article className="mmh-own-motion mx-auto w-full max-w-3xl [--mmh-start:var(--mmh-content-start)]">
      <nav aria-label="Percorso" className="mmh-rise [--mmh-i:0] flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-fog">
        <Link href="/esplora" className="hover:text-accent">
          Esplora
        </Link>
        {articolo.categoriaAntenati.map((categoria) => (
          <Fragment key={categoria.id}>
            <span aria-hidden="true">/</span>
            <Link href={`/esplora?categoriaIds=${categoria.id}`} className="hover:text-accent">
              {categoria.nome}
            </Link>
          </Fragment>
        ))}
      </nav>

      <h1 className="mmh-rise [--mmh-i:1] mt-4 font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
        {articolo.titolo}
      </h1>

      <div className="mmh-rise [--mmh-i:2] mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="rounded bg-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-asphalt">
          {articolo.categoriaNome}
        </span>
        {articolo.tag.slice(0, 4).map((t) => (
          <span key={t} className="rounded border border-paper/15 px-2 py-1 text-xs text-chrome">
            {t}
          </span>
        ))}
      </div>

      <div className="mmh-rise [--mmh-i:3] mt-6 flex items-center justify-between gap-4 border-y border-paper/10 py-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-heading text-xs font-bold text-accent"
          >
            {initials(articolo.autoreNome)}
          </div>
          <div>
            <p className="text-sm font-semibold text-paper">{articolo.autoreNome}</p>
            <p className="text-xs text-fog">
              {articolo.tempoLetturaMinuti} min di lettura · Aggiornato {formatAggiornato(articolo.dataUltimoAggiornamento)}
            </p>
          </div>
        </div>
        {actions}
      </div>

      {articolo.immagineCopertina && (
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore
        <img
          src={articolo.immagineCopertina}
          alt=""
          className="mmh-rise [--mmh-i:4] mt-8 aspect-[2/1] w-full rounded-lg border border-paper/10 object-cover"
        />
      )}

      <div className="mmh-rise [--mmh-i:5] mt-8">
        <ArticleMarkdownBody testo={articolo.testo} />
      </div>

      <ArticleReferences articolo={articolo} />
    </article>
  );
}
