import Link from "next/link";
import type { CategoryTreeNode } from "@/lib/categorie/types";

interface CategoryTileProps {
  node: CategoryTreeNode;
  /** Numero d'ordine mostrato in filigrana (opzionale). */
  index?: number;
  /** Se presente il riquadro è un link, altrimenti un pulsante (onClick). */
  href?: string;
  onClick?: () => void;
  /** Variante più bassa per modali/pannelli. */
  compact?: boolean;
  /** Segna il riquadro come categoria corrente. */
  active?: boolean;
}

/**
 * Riquadro categoria condiviso (Home, Esplora, selettore categoria dell'editor):
 * nome, numero di sezioni, freccia, numero in filigrana e hover con
 * sollevamento e linea d'accento.
 */
export function CategoryTile({ node, index, href, onClick, compact = false, active = false }: CategoryTileProps) {
  const sezioni = node.figlie.length;
  const className = `group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border bg-carbon text-left transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_12px_32px_-12px_rgba(61,169,252,0.45)] ${
    active ? "border-accent" : "border-paper/10"
  } ${compact ? "min-h-24 p-3 sm:p-4" : "min-h-32 p-4 sm:min-h-36 sm:p-5"}`;

  const content = (
    <>
      {index !== undefined && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-4 font-heading text-7xl font-bold text-paper/[0.04] transition duration-500 group-hover:-translate-x-1 group-hover:text-accent/15"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
      <span
        className={`font-heading font-bold uppercase leading-tight tracking-wide text-paper transition-colors group-hover:text-accent ${
          compact ? "text-base" : "text-lg sm:text-xl"
        }`}
      >
        {node.nome}
      </span>
      <span className="mt-3 flex items-center justify-between text-xs uppercase tracking-wide text-fog">
        <span>{sezioni > 0 ? `${sezioni} ${sezioni === 1 ? "sezione" : "sezioni"}` : "Esplora"}</span>
        <span aria-hidden="true" className="text-base transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent">
          →
        </span>
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-pressed={active || undefined} className={className}>
      {content}
    </button>
  );
}
