"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReportModalStore } from "@/lib/report/store";
import { useAuthStore } from "@/lib/auth/store";
import { reportUser } from "@/lib/report/reportUser";
import { FlagIcon } from "./icons";

/**
 * Montato una sola volta nel root layout (come ToastViewport/CookieBanner):
 * si apre da qualunque punto dell'app tramite openReportModal(id, nome),
 * non richiede che ogni pagina lo renderizzi.
 */
export function ReportUserModal() {
  const router = useRouter();
  const isOpen = useReportModalStore((s) => s.isOpen);
  const segnalatoId = useReportModalStore((s) => s.segnalatoId);
  const segnalatoNome = useReportModalStore((s) => s.segnalatoNome);
  const close = useReportModalStore((s) => s.close);
  const authStatus = useAuthStore((s) => s.status);

  const [motivazione, setMotivazione] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Difesa in profondità: RF1.9 richiede un utente registrato. ReportButton
  // già verifica lo stato prima di aprire il modale, ma se per qualunque
  // motivo risultasse aperto senza sessione valida, si chiude e reindirizza
  // — stesso principio di RoleGuard, mai un fallimento silenzioso al submit.
  useEffect(() => {
    if (isOpen && authStatus === "anonymous") {
      close();
      router.push("/login");
    }
  }, [isOpen, authStatus, close, router]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen || segnalatoId === null || authStatus !== "authenticated") {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const ok = await reportUser(segnalatoId, motivazione);
    setSubmitting(false);
    if (ok) {
      setMotivazione("");
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-md rounded-xl bg-carbon p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <FlagIcon className="h-6 w-6" />
        </div>

        <h2
          id="report-modal-title"
          className="mt-4 font-heading text-xl font-bold uppercase tracking-wide text-paper"
        >
          Segnala il profilo di &quot;{segnalatoNome ?? "questo utente"}&quot;
        </h2>
        <p className="mt-2 text-sm text-fog">
          La tua segnalazione verrà esaminata dal team di gestione della community. Ti
          contatteremo se necessario.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <label
            htmlFor="motivazione"
            className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome"
          >
            Motivazione
          </label>
          <textarea
            id="motivazione"
            required
            rows={4}
            value={motivazione}
            onChange={(event) => setMotivazione(event.target.value)}
            placeholder="Descrivi il problema riscontrato…"
            className="rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber"
          />

          <div className="mt-4 flex justify-end gap-6">
            <button
              type="button"
              onClick={close}
              className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-ember px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-60"
            >
              {submitting ? "Invio in corso…" : "Invia segnalazione"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
