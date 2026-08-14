"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyArticles } from "@/lib/articoli/useMyArticles";
import { apiFetch } from "@/lib/http/client";
import { toast } from "@/lib/toast/toast";
import { ArticleCard } from "@/components/public/ArticleCard";
import { StatoBadge } from "@/components/articoli/StatoBadge";
import { ConfirmDeleteModal } from "@/components/articoli/ConfirmDeleteModal";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { DocumentIcon, PencilIcon, EyeIcon } from "@/components/autore/icons";
import { TrashIcon, BookmarkIcon } from "@/components/account/icons";
import { SearchIcon } from "@/components/public/icons";
import type { MyArticle } from "@/lib/articoli/types";

type Tab = "TUTTI" | "PUBBLICATO" | "IN_ATTESA_APPROVAZIONE" | "RIFIUTATO";

const TAB_LABELS: Record<Tab, string> = {
  TUTTI: "Tutti",
  PUBBLICATO: "Pubblicati",
  IN_ATTESA_APPROVAZIONE: "In revisione",
  RIFIUTATO: "Rifiutati",
};

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

/**
 * I Miei Articoli (mockup 22). Il mockup mostra 4 tab (Tutti/Pubblicati/
 * In revisione/Rifiutati) e NESSUNA bozza tra le righe d'esempio: le
 * bozze vivono solo in Le Mie Bozze (mockup 25, punto 9) — coerente con
 * RF2.1 (questa pagina) vs RF2.7 (bozze) come casi d'uso distinti nel RAD.
 * Qui il dataset di getArticlesByAuthor viene quindi filtrato per
 * escludere BOZZA, non riproposto identico alla Dashboard.
 *
 * Ricerca testuale: il mockup ne mostra una ("Cerca tra i tuoi
 * articoli...") ma getArticlesByAuthor non ha alcun parametro di query —
 * a differenza di searchArticles, qui however la lista è già interamente
 * scaricata (nessuna paginazione, verificato al punto 6), quindi un
 * filtro per sottostringa lato client è dato reale filtrato, non finto.
 *
 * Azioni per riga — verificate sul backend, non assunte dal mockup:
 * PUBBLICATO ha modifica (updatePublishedArticle, via l'Editor punto 8) ed
 * elimina; RIFIUTATO ha le stesse due (modifica apre l'Editor sul pannello
 * "Correggi" -> reopenRejectedArticle, elimina usa deleteArticle, la cui
 * pre-condizione ora copre qualunque stato diverso da BOZZA, non solo
 * PUBBLICATO); IN_ATTESA_APPROVAZIONE ha solo elimina (nessun endpoint di
 * modifica per quello stato: il contenuto resta bloccato finché un Manager
 * non lo revisiona). updateDraft/deleteDraft restano BOZZA-only, ma le
 * bozze non compaiono comunque su questa pagina (vedi sopra).
 */
export default function IMieiArticoliPage() {
  const state = useMyArticles();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("TUTTI");
  const [pendingDelete, setPendingDelete] = useState<MyArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const nonBozza =
    state.status === "ready"
      ? state.articoli.filter((a) => a.stato !== "BOZZA" && !removedIds.has(a.id))
      : [];

  const filtrati = nonBozza.filter((a) => {
    const matchTab = tab === "TUTTI" || a.stato === tab;
    const matchSearch = a.titolo.toLowerCase().includes(search.trim().toLowerCase());
    return matchTab && matchSearch;
  });

  const counts: Record<Tab, number> = {
    TUTTI: nonBozza.length,
    PUBBLICATO: nonBozza.filter((a) => a.stato === "PUBBLICATO").length,
    IN_ATTESA_APPROVAZIONE: nonBozza.filter((a) => a.stato === "IN_ATTESA_APPROVAZIONE").length,
    RIFIUTATO: nonBozza.filter((a) => a.stato === "RIFIUTATO").length,
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const response = await apiFetch(`/api/v1/articoli/${pendingDelete.id}`, { method: "DELETE" });
    setDeleting(false);

    if (response.ok) {
      setRemovedIds((prev) => new Set(prev).add(pendingDelete.id));
      toast.success("Articolo eliminato con successo.");
      setPendingDelete(null);
    } else {
      toast.error("Non è stato possibile eliminare l'articolo. Riprova.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
            I Miei Articoli
          </h1>
        </div>
        <Link
          href="/autore/articoli/nuovo"
          className="shrink-0 rounded-md bg-accent px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          + Nuovo articolo
        </Link>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare i tuoi articoli.</p>
      ) : nonBozza.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="h-6 w-6" />}
          title="Nessun articolo ancora"
          description="Gli articoli che scrivi e pubblichi compariranno qui."
          action={{ label: "Nuovo articolo", href: "/autore/articoli/nuovo" }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="cerca-articoli" className="sr-only">
              Cerca tra i tuoi articoli
            </label>
            <input
              id="cerca-articoli"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca tra i tuoi articoli…"
              className="w-full max-w-sm rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="flex flex-wrap gap-2 rounded-lg bg-carbon p-2">
              {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-pressed={tab === t}
                  className={`rounded-md px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide ${
                    tab === t ? "bg-accent text-asphalt" : "text-chrome"
                  }`}
                >
                  {TAB_LABELS[t]} ({counts[t]})
                </button>
              ))}
            </div>
          </div>

          {filtrati.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-6 w-6" />}
              title="Nessun risultato"
              description="Nessun articolo corrisponde alla ricerca o al filtro applicato."
            />
          ) : (
            <div className="grid gap-6 rounded-lg border border-paper/10 bg-carbon p-6 md:grid-cols-2">
              {filtrati.map((articolo) => (
                <ArticleCard
                  key={articolo.id}
                  articolo={articolo}
                  linkable={articolo.stato === "PUBBLICATO"}
                  badge={
                    <>
                      <StatoBadge stato={articolo.stato} />
                      <span className="flex items-center gap-1 text-xs text-fog">
                        <EyeIcon className="h-3.5 w-3.5" />
                        {articolo.stato === "PUBBLICATO"
                          ? `${articolo.numeroVisualizzazioni} letture`
                          : "— letture"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-fog">
                        <BookmarkIcon className="h-3.5 w-3.5" />
                        {articolo.stato === "PUBBLICATO"
                          ? `${articolo.numeroSalvataggi} salvataggi`
                          : "— salvataggi"}
                      </span>
                      <span className="text-xs text-fog">{formatData(articolo.dataUltimoAggiornamento)}</span>
                    </>
                  }
                  action={
                    articolo.stato === "PUBBLICATO" || articolo.stato === "RIFIUTATO" ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/autore/articoli/${articolo.id}/modifica`}
                          aria-label="Modifica articolo"
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-accent"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(articolo)}
                          aria-label="Elimina articolo"
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : articolo.stato === "IN_ATTESA_APPROVAZIONE" ? (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(articolo)}
                        aria-label="Elimina articolo"
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
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
