"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyArticles } from "@/lib/articoli/useMyArticles";
import { apiFetch } from "@/lib/http/client";
import { toast } from "@/lib/toast/toast";
import { StatoBadge } from "@/components/articoli/StatoBadge";
import { ConfirmDeleteModal } from "@/components/articoli/ConfirmDeleteModal";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { PencilIcon } from "@/components/autore/icons";
import { TrashIcon } from "@/components/account/icons";
import type { ArticleSummary } from "@/lib/articoli/types";

function formatUltimaModifica(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minuti = Math.floor(diffMs / 60_000);
  const ore = Math.floor(diffMs / 3_600_000);
  const giorni = Math.floor(diffMs / 86_400_000);
  const settimane = Math.floor(giorni / 7);
  const mesi = Math.floor(giorni / 30);

  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} minut${minuti === 1 ? "o" : "i"} fa`;
  if (ore < 24) return `${ore} or${ore === 1 ? "a" : "e"} fa`;
  if (giorni < 7) return `${giorni} giorn${giorni === 1 ? "o" : "i"} fa`;
  if (settimane < 5) return `${settimane} settiman${settimane === 1 ? "a" : "e"} fa`;
  if (mesi < 12) return `${mesi} mes${mesi === 1 ? "e" : "i"} fa`;
  return new Date(iso).toLocaleDateString("it-IT");
}

/**
 * Le Mie Bozze (mockup 25, punto 9 — ultimo di GestioneArticoli lato
 * frontend). Stesso dataset di I Miei Articoli (getArticlesByAuthor via
 * useMyArticles), filtrato qui sul solo stato BOZZA invece di escluderlo —
 * stesso pattern client-side, dataset speculare.
 *
 * Card dedicata invece di riusare ArticleCard: il mockup mostra box
 * distinti (bordo/sfondo propri, non righe separate da un bordo dentro un
 * contenitore condiviso come in I Miei Articoli) e senza copertina/
 * categoria/estratto — solo badge, titolo, "Ultima modifica" relativo
 * ("2 giorni fa", non la data assoluta di I Miei Articoli) e la coppia di
 * azioni Riprendi/Elimina. ArticleCard è pensato per l'altro layout, non
 * per questo.
 *
 * Riprendi apre l'Editor (punto 8) sullo stesso id: essendo già in BOZZA,
 * ArticleEditor mostra direttamente il form precompilato (nessun pannello
 * di stato speciale, quello è solo per RIFIUTATO/IN_ATTESA_APPROVAZIONE).
 * Elimina usa deleteDraft (DELETE /articoli/bozze/{id}), diverso da
 * deleteArticle: unico endpoint di cancellazione valido per una BOZZA.
 */
export default function LeMieBozzePage() {
  const state = useMyArticles();
  const [pendingDelete, setPendingDelete] = useState<ArticleSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const bozze =
    state.status === "ready"
      ? state.articoli.filter((a) => a.stato === "BOZZA" && !removedIds.has(a.id))
      : [];

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const response = await apiFetch(`/api/v1/articoli/bozze/${pendingDelete.id}`, { method: "DELETE" });
    setDeleting(false);

    if (response.ok) {
      setRemovedIds((prev) => new Set(prev).add(pendingDelete.id));
      toast.success("Bozza eliminata con successo.");
      setPendingDelete(null);
    } else {
      toast.error("Non è stato possibile eliminare la bozza. Riprova.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Le Mie Bozze
        </h1>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare le tue bozze.</p>
      ) : bozze.length === 0 ? (
        <EmptyState
          icon={<PencilIcon className="h-6 w-6" />}
          title="Nessuna bozza"
          description="Gli articoli che salvi senza inviarli in approvazione compariranno qui."
          action={{ label: "Nuovo articolo", href: "/autore/articoli/nuovo" }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {bozze.map((articolo) => (
            <div key={articolo.id} className="flex flex-col gap-4 rounded-lg bg-carbon p-6">
              <StatoBadge stato={articolo.stato} />

              <div>
                <h3 className="font-heading text-lg font-bold text-paper">{articolo.titolo}</h3>
                <p className="mt-1 text-xs text-fog">
                  Ultima modifica: {formatUltimaModifica(articolo.dataUltimoAggiornamento)}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/autore/articoli/${articolo.id}/modifica`}
                  className="flex-1 rounded-md bg-asphalt/80 px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-chrome hover:text-accent"
                >
                  Riprendi
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(articolo)}
                  aria-label="Elimina bozza"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDeleteModal
          titolo={pendingDelete.titolo}
          pending={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
