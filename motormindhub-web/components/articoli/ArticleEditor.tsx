"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCategoryTree, flattenCategoryTree } from "@/lib/categorie/useCategoryTree";
import { useEditableArticle } from "@/lib/articoli/useEditableArticle";
import {
  createDraft,
  updateDraft,
  publishArticle,
  updatePublishedArticle,
  reopenRejectedArticle,
  type ArticleDraftInput,
} from "@/lib/articoli/articleEditor";
import { toast } from "@/lib/toast/toast";
import { StatoBadge } from "@/components/articoli/StatoBadge";
import { WarningIcon } from "@/components/account/icons";
import { CloseIcon } from "@/components/public/icons";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import type { ArticleDetail } from "@/lib/articoli/types";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber";
const labelClassName = "font-heading text-xs font-semibold uppercase tracking-wide text-fog";
const primaryButtonClassName =
  "w-full rounded-md bg-amber px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60";
const secondaryButtonClassName =
  "w-full rounded-md bg-carbon px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-60";

/**
 * Punto 8 (mockup 23/24): componente condiviso, si comporta diversamente in
 * base allo stato dell'articolo caricato (ArticleDetailDTO) — deciso nel
 * piano iniziale. Nessun id (nuovo, mockup 23) e BOZZA esistente condividono
 * lo stesso form (ArticleEditorForm sotto); PUBBLICATO usa lo stesso form ma
 * con una sola azione diretta (updatePublishedArticle, "nessun passaggio per
 * bozza" per istruzione esplicita, anche se il mockup 24 mostra comunque due
 * pulsanti); RIFIUTATO non è editabile direttamente (pannello dedicato);
 * IN_ATTESA_APPROVAZIONE non ha alcun endpoint di modifica (nessun mockup
 * per questo caso, qui solo per chi arriva con un link/id diretto: nessuna
 * riga di I Miei Articoli linka qui in questo stato).
 */
export function ArticleEditor({ articleId }: { articleId: number | null }) {
  if (articleId === null) {
    return <ArticleEditorForm articolo={null} />;
  }
  return <ExistingArticleEditor articleId={articleId} />;
}

function ExistingArticleEditor({ articleId }: { articleId: number }) {
  const editable = useEditableArticle(articleId);

  if (editable.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }
  if (editable.status === "not-found") {
    return <p className="text-sm text-ember">Articolo non trovato.</p>;
  }

  const { articolo } = editable;

  if (articolo.stato === "RIFIUTATO") {
    return <RejectedArticlePanel articolo={articolo} onReopened={editable.reload} />;
  }
  if (articolo.stato === "IN_ATTESA_APPROVAZIONE") {
    return (
      <div className="flex flex-col gap-3 rounded-lg bg-carbon p-6">
        <StatoBadge stato={articolo.stato} />
        <p className="text-sm text-fog">
          &quot;{articolo.titolo}&quot; è in attesa di revisione da parte di un Manager Autori:
          nessuna modifica è possibile finché non viene approvato o rifiutato.
        </p>
      </div>
    );
  }

  // BOZZA o PUBBLICATO: key forza il remount del form (nuovi useState
  // iniziali) quando lo stato cambia sotto lo stesso id, es. dopo
  // reopenRejectedArticle (RIFIUTATO -> BOZZA, gestito sopra) o un futuro
  // reload con contenuto diverso.
  return <ArticleEditorForm key={`${articolo.id}-${articolo.stato}`} articolo={articolo} />;
}

/**
 * RIFIUTATO (RF2.7, UC_18/21): mostra la motivazione del Manager e l'unica
 * azione possibile, "Correggi" (reopenRejectedArticle) — non un form, il
 * contenuto resta di sola lettura finché l'articolo non torna in BOZZA.
 */
function RejectedArticlePanel({
  articolo,
  onReopened,
}: {
  articolo: ArticleDetail;
  onReopened: () => void;
}) {
  const [reopening, setReopening] = useState(false);

  const handleCorreggi = async () => {
    setReopening(true);
    const ok = await reopenRejectedArticle(articolo.id);
    setReopening(false);
    if (ok) {
      toast.success("Articolo riportato in bozza: ora puoi correggerlo.");
      onReopened();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 rounded-lg border border-ember/40 bg-ember/10 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember/10 text-ember">
          <WarningIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-ember">
            Articolo rifiutato
          </h2>
          <p className="text-sm text-fog">
            {articolo.motivazioneRifiuto ?? "Nessuna motivazione indicata dal Manager Autori."}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-carbon p-6">
        <p className={labelClassName}>Titolo</p>
        <p className="mt-2 text-base text-paper">{articolo.titolo}</p>
        <p className={`${labelClassName} mt-4`}>Categoria</p>
        <p className="mt-2 text-sm text-chrome">{articolo.categoriaNome}</p>
      </div>

      <button
        type="button"
        onClick={() => void handleCorreggi()}
        disabled={reopening}
        className={primaryButtonClassName}
      >
        {reopening ? "Riapertura…" : "Correggi"}
      </button>
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1.5 rounded bg-surface-raised px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-chrome"
        >
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((existing) => existing !== t))}
            aria-label={`Rimuovi tag ${t}`}
            className="text-fog hover:text-ember"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </span>
      ))}

      {adding ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="Nuovo tag…"
          className="rounded bg-surface-raised px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-chrome outline-none focus:ring-2 focus:ring-amber"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-chrome/40 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-fog hover:text-chrome"
        >
          + Aggiungi
        </button>
      )}
    </div>
  );
}

/**
 * Form condiviso da nuovo/BOZZA/PUBBLICATO. Nessun autosalvataggio: il
 * mockup mostra solo azioni esplicite (pulsanti), niente indizio di salvataggio
 * in background — coerente con updateDraft/updatePublishedArticle come azioni
 * mutanti che vanno confermate da un click, non scatenate dalla digitazione.
 *
 * Niente toolbar di formattazione (B/I/H1/H2/citazione del mockup): il testo
 * è reso in sola lettura come paragrafi di testo semplice (cfr.
 * ArticleDetailContent, split su doppio a-capo), non esiste alcun motore di
 * rendering HTML/Markdown lato pubblico — una toolbar la simulerebbe senza
 * che l'effetto sia mai visibile all'autore.
 *
 * Immagine di copertina: upload reale (ImageUploadField, condiviso con
 * impostazioni/page.tsx), non più un campo URL testuale — ArticleDraftDTO la
 * tratta comunque come una semplice stringa, un URL esterno storico
 * pre-migrazione resta quindi visibile in preview senza alcuna logica
 * speciale.
 */
function ArticleEditorForm({ articolo }: { articolo: ArticleDetail | null }) {
  const router = useRouter();
  const categoryTree = useCategoryTree();
  const flatCategorie = categoryTree.status === "ready" ? flattenCategoryTree(categoryTree.tree) : [];

  const [titolo, setTitolo] = useState(articolo?.titolo ?? "");
  const [testo, setTesto] = useState(articolo?.testo ?? "");
  const [categoriaId, setCategoriaId] = useState<number | null>(articolo?.categoriaId ?? null);
  const [tags, setTags] = useState<string[]>(articolo?.tag ?? []);
  const [immagineCopertina, setImmagineCopertina] = useState(articolo?.immagineCopertina ?? "");

  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isPubblicato = articolo?.stato === "PUBBLICATO";

  const buildDraftInput = (): ArticleDraftInput => ({
    titolo: titolo.trim(),
    testo,
    categoriaId,
    tag: tags,
    immagineCopertina: immagineCopertina.trim() || null,
  });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    if (articolo === null) {
      const id = await createDraft(buildDraftInput());
      setSavingDraft(false);
      if (id !== null) {
        toast.success("Bozza salvata con successo.");
        router.replace(`/autore/articoli/${id}/modifica`);
      }
      return;
    }
    await updateDraft(articolo.id, buildDraftInput());
    setSavingDraft(false);
  };

  // publishArticle non accetta un body: senza salvare prima le modifiche
  // correnti, "Invia in approvazione" pubblicherebbe silenziosamente
  // l'ultimo contenuto salvato invece di quello a schermo.
  const handlePublish = async () => {
    if (!titolo.trim() || !categoriaId) {
      toast.error("Titolo e categoria sono obbligatori per inviare l'articolo in approvazione.");
      return;
    }

    setPublishing(true);
    let draftId = articolo?.id ?? null;

    if (draftId === null) {
      draftId = await createDraft(buildDraftInput());
      if (draftId === null) {
        setPublishing(false);
        return;
      }
    } else {
      const saved = await updateDraft(draftId, buildDraftInput());
      if (!saved) {
        setPublishing(false);
        return;
      }
    }

    const published = await publishArticle(draftId);
    setPublishing(false);

    if (published) {
      router.push("/autore/articoli");
    } else if (articolo === null) {
      // La bozza è stata comunque creata: non lasciarla irraggiungibile.
      router.replace(`/autore/articoli/${draftId}/modifica`);
    }
  };

  const handleUpdatePublished = async () => {
    if (!articolo) return;
    if (!titolo.trim() || !testo.trim() || !categoriaId) {
      toast.error("Titolo, testo e categoria sono obbligatori.");
      return;
    }

    setSavingDraft(true);
    await updatePublishedArticle(articolo.id, {
      titolo: titolo.trim(),
      testo,
      categoriaId,
      tag: tags,
      immagineCopertina: immagineCopertina.trim() || null,
    });
    setSavingDraft(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="editor-titolo" className="sr-only">
          Titolo dell&apos;articolo
        </label>
        <input
          id="editor-titolo"
          type="text"
          maxLength={300}
          value={titolo}
          onChange={(event) => setTitolo(event.target.value)}
          placeholder="Titolo dell'articolo…"
          className={`${inputClassName} text-base`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="editor-testo" className="sr-only">
          Testo dell&apos;articolo
        </label>
        <textarea
          id="editor-testo"
          rows={16}
          value={testo}
          onChange={(event) => setTesto(event.target.value)}
          placeholder="Scrivi qui il contenuto dell'articolo…"
          className={`${inputClassName} resize-y leading-relaxed`}
        />
      </div>

      <div className="flex flex-col gap-6 rounded-lg border border-paper/10 bg-carbon p-6">
        <p className="font-heading text-sm font-bold uppercase tracking-wide text-paper">Pubblicazione</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="editor-categoria" className={labelClassName}>
            Categoria
          </label>
          <select
            id="editor-categoria"
            value={categoriaId ?? ""}
            onChange={(event) => setCategoriaId(event.target.value ? Number(event.target.value) : null)}
            className={inputClassName}
          >
            <option value="">Seleziona una categoria…</option>
            {flatCategorie.map((c) => (
              <option key={c.id} value={c.id}>
                {"    ".repeat(c.depth)}
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <p className={labelClassName}>Tag</p>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div className="flex flex-col gap-2">
          <p className={labelClassName}>Immagine di copertina</p>
          <ImageUploadField
            variant="cover"
            value={immagineCopertina || null}
            onChange={setImmagineCopertina}
            endpoint="/api/v1/articoli/copertine"
            maxSizeBytes={5 * 1024 * 1024}
            label="Carica immagine di copertina"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isPubblicato ? (
          <button
            type="button"
            onClick={() => void handleUpdatePublished()}
            disabled={savingDraft}
            className={primaryButtonClassName}
          >
            {savingDraft ? "Aggiornamento…" : "Aggiorna articolo"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing || savingDraft}
              className={primaryButtonClassName}
            >
              {publishing ? "Invio in corso…" : "Invia in approvazione"}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={savingDraft || publishing}
              className={secondaryButtonClassName}
            >
              {savingDraft ? "Salvataggio…" : "Salva bozza"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
