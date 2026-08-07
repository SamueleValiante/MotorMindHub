interface PaginationProps {
  /** 0-indexed, coerente con "pagina" di ArticleSearchResultDTO (Spring Pageable). */
  pagina: number;
  totalPages: number;
  onChange: (pagina: number) => void;
}

/** Paginazione offset/limit (pagina + dimensionePagina), non a cursore: cosi' espone davvero searchArticles. */
export function Pagination({ pagina, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Paginazione risultati">
      <button
        type="button"
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 0}
        aria-label="Pagina precedente"
        className="rounded-md border border-chrome/40 px-3 py-2 text-chrome disabled:opacity-30"
      >
        ←
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === pagina ? "page" : undefined}
          className={`rounded-md px-3 py-2 font-heading text-sm font-bold ${
            p === pagina ? "bg-accent text-asphalt" : "border border-chrome/40 text-chrome"
          }`}
        >
          {p + 1}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(pagina + 1)}
        disabled={pagina >= totalPages - 1}
        aria-label="Pagina successiva"
        className="rounded-md border border-chrome/40 px-3 py-2 text-chrome disabled:opacity-30"
      >
        →
      </button>
    </nav>
  );
}
