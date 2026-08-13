"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { DateRangeSelector, type IntervalloGiorni } from "@/components/charts/DateRangeSelector";
import { useAndamentoVisite } from "@/lib/amministrazioneUtenti/useAndamentoVisite";
import { useAndamentoRegistrazioni } from "@/lib/amministrazioneUtenti/useAndamentoRegistrazioni";

/**
 * Tre grafici sotto "Visite al sito" (Dashboard Gestore Utenti), un solo
 * selettore di intervallo condiviso (7/30/90 giorni, mai per-grafico — cfr.
 * skill dataviz). "Andamento visite" (Grafico A, una serie) è la somma
 * guest+iscritto calcolata lato client dalla STESSA risposta di "Visite
 * per tipo di visitatore" (Grafico B, due serie) — non una chiamata
 * separata, per non raddoppiare la query sul backend per un dato derivabile.
 *
 * Guest -> accent, Iscritto -> --color-series-secondary: MAI ember (stato
 * "critico" nel design system) né success (stato "attivo/ok") per
 * un'identità di serie che non rappresenta uno stato di dominio — cfr.
 * commento in app/globals.css.
 */
export function AndamentoCharts() {
  const [giorni, setGiorni] = useState<IntervalloGiorni>(30);
  const visite = useAndamentoVisite(giorni);
  const registrazioni = useAndamentoRegistrazioni(giorni);

  // "Il refetch tiene il fotogramma" (skill dataviz, interaction.md): i due
  // hook tengono da soli l'ultima risposta valida durante un refetch (cfr.
  // isRefetching/ultimiPunti lì) — qui basta consumarla.
  const puntiVisite = visite.punti;
  const puntiRegistrazioni = registrazioni.punti;

  const serieTotaleVisite = useMemo(
    () => [
      {
        key: "totale",
        label: "Visite",
        color: "var(--color-accent)",
        points: puntiVisite.map((p) => ({ data: p.data, valore: p.guest + p.iscritto })),
      },
    ],
    [puntiVisite]
  );

  const serieVisitePerTipo = useMemo(
    () => [
      {
        key: "guest",
        label: "Guest",
        color: "var(--color-accent)",
        points: puntiVisite.map((p) => ({ data: p.data, valore: p.guest })),
      },
      {
        key: "iscritto",
        label: "Iscritto",
        color: "var(--color-series-secondary)",
        points: puntiVisite.map((p) => ({ data: p.data, valore: p.iscritto })),
      },
    ],
    [puntiVisite]
  );

  const serieRegistrazioni = useMemo(
    () => [
      {
        key: "registrazioni",
        label: "Nuove registrazioni",
        color: "var(--color-accent)",
        points: puntiRegistrazioni.map((p) => ({ data: p.data, valore: p.numeroRegistrazioni })),
      },
    ],
    [puntiRegistrazioni]
  );

  const refetching = visite.isRefetching || registrazioni.isRefetching;
  const haDatiPregressi = puntiVisite.length > 0 || puntiRegistrazioni.length > 0;
  const primoCaricamento = (visite.status === "loading" || registrazioni.status === "loading") && !haDatiPregressi;
  const errore = (visite.status === "error" || registrazioni.status === "error") && !haDatiPregressi;

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
              Andamento visite
            </h3>
            <LineChart series={serieTotaleVisite} ariaLabel={`Andamento visite, ultimi ${giorni} giorni`} />
          </div>

          <div className="rounded-lg bg-surface-raised p-4">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Visite per tipo di visitatore
            </h3>
            <LineChart
              series={serieVisitePerTipo}
              ariaLabel={`Visite per tipo di visitatore, ultimi ${giorni} giorni`}
            />
          </div>

          <div className="rounded-lg bg-surface-raised p-4 lg:col-span-2">
            <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wide text-paper">
              Andamento registrazioni
            </h3>
            <LineChart
              series={serieRegistrazioni}
              ariaLabel={`Andamento registrazioni, ultimi ${giorni} giorni`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
