"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { apiFetch } from "@/lib/http/client";
import { toast } from "@/lib/toast/toast";
import { BookmarkIcon } from "@/components/account/icons";
import { ClockIcon } from "@/components/public/icons";
import type { TipoLista } from "@/lib/articoli/types";

const LIST_LABELS: Record<TipoLista, { add: string; remove: string; Icon: typeof BookmarkIcon }> = {
  PREFERITI: { add: "Aggiungi ai Preferiti", remove: "Rimuovi dai Preferiti", Icon: BookmarkIcon },
  LEGGI_PIU_TARDI: { add: "Aggiungi a Leggi più tardi", remove: "Rimuovi da Leggi più tardi", Icon: ClockIcon },
};

/**
 * Menu di salvataggio (mockup 03b): saveArticleToList/removeArticleFromList
 * (RF1.7, UC_6/UC_7), solo per utenti autenticati — stesso pattern di
 * ReportButton per il redirect al login da anonimo.
 *
 * Il mockup non mostra lo stato "già salvato" (mostra solo "Aggiungi..."):
 * qui invece la voce diventa "Rimuovi..." se l'articolo è già in quella
 * lista, altrimenti riaprire il menu e premere di nuovo lo stesso pulsante
 * chiamerebbe sempre saveArticleToList, che fallisce se l'elemento c'è già
 * (precondizione ODD: "not exists" prima del salvataggio) — nessun mockup
 * dedicato per quel caso, ma removeArticleFromList esiste davvero ed è
 * l'unico modo onesto di rendere il controllo un vero toggle.
 */
export function SaveMenu({ articleId }: { articleId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((s) => s.status);

  const [open, setOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saved, setSaved] = useState<Set<TipoLista>>(new Set());
  const [pending, setPending] = useState<TipoLista | null>(null);

  const handleTrigger = async () => {
    if (authStatus === "anonymous") {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }

    setLoadingStatus(true);
    const response = await apiFetch("/api/v1/articoli/salvataggi");
    if (response.ok) {
      const list: Array<{ articolo: { id: number }; tipoLista: TipoLista }> = await response.json();
      setSaved(new Set(list.filter((s) => s.articolo.id === articleId).map((s) => s.tipoLista)));
    }
    setLoadingStatus(false);
    setOpen(true);
  };

  const toggle = async (tipo: TipoLista) => {
    const isSaved = saved.has(tipo);
    setPending(tipo);

    const response = isSaved
      ? await apiFetch(`/api/v1/articoli/${articleId}/salvataggi/${tipo}`, { method: "DELETE" })
      : await apiFetch(`/api/v1/articoli/${articleId}/salvataggi`, {
          method: "POST",
          body: JSON.stringify({ tipoLista: tipo }),
        });

    setPending(null);

    if (response.ok) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(tipo);
        else next.add(tipo);
        return next;
      });
      toast.success(isSaved ? "Rimosso dai salvataggi." : "Articolo salvato.");
      setOpen(false);
    } else {
      toast.error("Non è stato possibile completare l'operazione. Riprova.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleTrigger()}
        disabled={authStatus === "loading" || loadingStatus}
        aria-label="Salva articolo"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-chrome/40 text-chrome hover:text-accent disabled:opacity-50"
      >
        <BookmarkIcon className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-paper/10 bg-carbon py-1 shadow-xl">
            {(Object.entries(LIST_LABELS) as Array<[TipoLista, (typeof LIST_LABELS)[TipoLista]]>).map(
              ([tipo, { add, remove, Icon }]) => (
                <button
                  key={tipo}
                  type="button"
                  disabled={pending === tipo}
                  onClick={() => void toggle(tipo)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-paper hover:bg-paper/5 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  {saved.has(tipo) ? remove : add}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
