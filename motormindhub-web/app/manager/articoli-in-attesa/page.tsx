"use client";

import Link from "next/link";
import { usePendingArticles } from "@/lib/autori/usePendingArticles";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { DocumentIcon } from "@/components/autore/icons";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

/** Articoli in Attesa di Approvazione (mockup 36, RF3.1/RF3.6). */
export default function ArticoliInAttesaPage() {
  const pending = usePendingArticles();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Articoli in Attesa di Approvazione
        </h1>
      </div>

      {pending.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : pending.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare la coda di approvazione.</p>
      ) : pending.articoli.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="h-6 w-6" />}
          title="Nessun articolo in attesa"
          description="Gli articoli inviati in approvazione dagli autori compariranno qui."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Titolo</th>
                <th className="px-6 py-4 font-heading font-semibold">Autore</th>
                <th className="px-6 py-4 font-heading font-semibold">Categoria</th>
                <th className="px-6 py-4 font-heading font-semibold">Inviato</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {pending.articoli.map((articolo) => (
                <tr key={articolo.id} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4 text-paper">{articolo.titolo}</td>
                  <td className="px-6 py-4 text-chrome">{articolo.autoreNome}</td>
                  <td className="px-6 py-4 text-chrome">{articolo.categoriaNome ?? "—"}</td>
                  <td className="px-6 py-4 text-chrome">{formatData(articolo.dataInvio)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/manager/articoli-in-attesa/${articolo.id}`}
                        className="rounded-md border border-paper/20 px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-paper"
                      >
                        Rivedi
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
