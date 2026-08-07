"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useArticle } from "@/lib/articoli/useArticle";
import { approveArticle, rejectArticle } from "@/lib/autori/authorMutations";
import { toast } from "@/lib/toast/toast";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

/**
 * Revisione Articolo (mockup 37, RF3.6, UC_21). PendingArticleDTO (lista
 * coda) non porta testo/immagine: riuso diretto di useArticle/ArticleDetail
 * (GET /api/v1/articoli/{id}, permitAll, nessun filtro per stato) per il
 * contenuto completo — stesso hook già usato dal dettaglio pubblico.
 */
export default function RevisioneArticoloPage() {
  const params = useParams<{ articleId: string }>();
  const router = useRouter();
  const parsedId = /^\d+$/.test(params.articleId) ? Number(params.articleId) : null;
  const state = useArticle(parsedId);

  const [motivazione, setMotivazione] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    if (parsedId === null) return;
    setPending("approve");
    const ok = await approveArticle(parsedId);
    setPending(null);
    if (ok) router.push("/manager/articoli-in-attesa");
  };

  const handleReject = async () => {
    if (parsedId === null) return;
    if (!motivazione.trim()) {
      toast.error("Inserire una motivazione per il rifiuto.");
      return;
    }
    setPending("reject");
    const ok = await rejectArticle(parsedId, motivazione.trim());
    setPending(null);
    if (ok) router.push("/manager/articoli-in-attesa");
  };

  if (state.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }

  if (state.status === "not-found") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
          Articolo non trovato
        </h1>
        <Link href="/manager/articoli-in-attesa" className="font-heading text-sm font-bold uppercase text-accent">
          ← Torna alla coda di approvazione
        </Link>
      </div>
    );
  }

  const articolo = state.articolo;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Revisione Articolo
        </h1>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <span className="inline-block rounded bg-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-asphalt">
          {articolo.categoriaNome}
        </span>

        <h2 className="mt-4 font-heading text-xl font-bold uppercase tracking-wide text-paper">
          {articolo.titolo}
        </h2>

        <p className="mt-2 text-xs text-fog">
          {articolo.autoreNome} · Inviato il {formatData(articolo.dataUltimoAggiornamento)}
        </p>

        {articolo.immagineCopertina ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria fornita dall'autore
          <img
            src={articolo.immagineCopertina}
            alt=""
            className="mt-6 aspect-video w-full rounded-lg object-cover"
          />
        ) : (
          <div className="mt-6 aspect-video w-full rounded-lg bg-surface-raised" />
        )}

        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-chrome">
          {articolo.testo.split(/\n{2,}/).map((paragrafo, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {paragrafo}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">Decisione</p>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={pending !== null}
            className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending === "approve" ? "Approvazione…" : "✓ Approva e pubblica"}
          </button>
          <button
            type="button"
            onClick={() => void handleReject()}
            disabled={pending !== null}
            className="rounded-md border border-ember px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-ember disabled:opacity-50"
          >
            {pending === "reject" ? "Rifiuto…" : "✕ Rifiuta"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <label htmlFor="motivazione-rifiuto" className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">
          Motivazione (se rifiuto)
        </label>
        <textarea
          id="motivazione-rifiuto"
          value={motivazione}
          onChange={(event) => setMotivazione(event.target.value)}
          rows={4}
          placeholder="Facoltativo se approvato…"
          className="mt-2 w-full rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
}
