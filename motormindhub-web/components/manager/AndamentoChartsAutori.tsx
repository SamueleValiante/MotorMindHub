"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { DateRangeSelector, type IntervalloGiorni } from "@/components/charts/DateRangeSelector";
import { useAndamentoPubblicazioni } from "@/lib/autori/useAndamentoPubblicazioni";
import { useAndamentoCategorie } from "@/lib/autori/useAndamentoCategorie";
import { useAndamentoApprovazioni } from "@/lib/autori/useAndamentoApprovazioni";
import { useAndamentoLetture } from "@/lib/autori/useAndamentoLetture";

/**
 * Quattro grafici andamento sotto le statistiche di riepilogo (Dashboard Manageriale), un solo
 * selettore di intervallo condiviso (7/30/90 giorni, mai per-grafico — cfr. skill dataviz),
 * stesso pattern di components/gestore/AndamentoCharts.tsx.
 *
 * "Andamento approvazioni": rifiutati -> --color-ember (stesso rosso/arancio usato per lo
 * StatCard "In attesa di approvazione" e per lo stato critico nel design system), approvati ->
 * --color-success. A differenza di Guest/Iscritto in AndamentoCharts, qui le due serie
 * RAPPRESENTANO uno stato di dominio (esito della decisione del Manager), quindi ember/success
 * sono la scelta corretta invece di --color-series-secondary.
 */
export function AndamentoChartsAutori() {
  const [giorni, setGiorni] = useState<IntervalloGiorni>(30);
  const pubblicazioni = useAndamentoPubblicazioni(giorni);
  const categorie = useAndamentoCategorie(giorni);
  const approvazioni = useAndamentoApprovazioni(giorni);
  const letture = useAndamentoLetture(giorni);

  const seriePubblicazioni = useMemo(
    () => [
      {
        key: "pubblicazioni",
        label: "Pubblicazioni",
        color: "var(--color-accent)",
        points: pubblicazioni.punti.map((p) => ({ data: p.data, valore: p.numeroPubblicazioni })),
      },
    ],
    [pubblicazioni.punti]
  );

  const serieCategorie = useMemo(
    () => [
      {
        key: "categorie",
        label: "Nuove categorie",
        color: "var(--color-accent)",
        points: categorie.punti.map((p) => ({ data: p.data, valore: p.numeroCategorie })),
      },
    ],
    [categorie.punti]
  );

  const serieApprovazioni = useMemo(
    () => [
      {
        key: "approvati",
        label: "Approvati",
        color: "var(--color-success)",
        points: approvazioni.punti.map((p) => ({ data: p.data, valore: p.approvati })),
      },
      {
        key: "rifiutati",
        label: "Rifiutati",
        color: "var(--color-ember)",
        points: approvazioni.punti.map((p) => ({ data: p.data, valore: p.rifiutati })),
      },
    ],
    [approvazioni.punti]
  );

  const serieLetture = useMemo(
    () => [
      {
        key: "letture",
        label: "Letture",
        color: "var(--color-accent)",
        points: letture.punti.map((p) => ({ data: p.data, valore: p.numeroLetture })),
      },
    ],
    [letture.punti]
  );

  const refetching =
    pubblicazioni.isRefetching || categorie.isRefetching || approvazioni.isRefetching || letture.isRefetching;
  const haDatiPregressi =
    pubblicazioni.punti.length > 0 ||
    categorie.punti.length > 0 ||
    approvazioni.punti.length > 0 ||
    letture.punti.length > 0;
  const primoCaricamento =
    (pubblicazioni.status === "loading" ||
      categorie.status === "loading" ||
      approvazioni.status === "loading" ||
      letture.status === "loading") &&
    !haDatiPregressi;
  const errore =
    (pubblicazioni.status === "error" ||
      categorie.status === "error" ||
      approvazioni.status === "error" ||
      letture.status === "error") &&
    !haDatiPregressi;

  return (
    <div className="flex flex-col gap-6">
      <DateRangeSelector value={giorni} onChange={setGiorni} />

      {primoCaricamento ? (
        <p className="text-sm text-fog">Caricamento andamento…</p>
      ) : errore ? (
        <p className="text-sm text-ember">Non è stato possibile caricare l&apos;andamento.</p>
      ) : (
        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-opacity ${refetching ? "opacity-60" : "opacity-100"}`}
        >
          <div className="rounded-lg bg-surface-raised p-4">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Andamento pubblicazioni
            </h3>
            <LineChart series={seriePubblicazioni} ariaLabel={`Andamento pubblicazioni, ultimi ${giorni} giorni`} />
          </div>

          <div className="rounded-lg bg-surface-raised p-4">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Andamento categorie
            </h3>
            <LineChart series={serieCategorie} ariaLabel={`Andamento categorie, ultimi ${giorni} giorni`} />
          </div>

          <div className="rounded-lg bg-surface-raised p-4">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Andamento letture totali
            </h3>
            <LineChart series={serieLetture} ariaLabel={`Andamento letture totali, ultimi ${giorni} giorni`} />
          </div>

          <div className="rounded-lg bg-surface-raised p-4 lg:col-span-2">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Andamento approvazioni
            </h3>
            <LineChart series={serieApprovazioni} ariaLabel={`Andamento approvazioni, ultimi ${giorni} giorni`} />
          </div>
        </div>
      )}
    </div>
  );
}
