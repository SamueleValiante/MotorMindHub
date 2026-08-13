const OPZIONI = [7, 30, 90] as const;

export type IntervalloGiorni = (typeof OPZIONI)[number];

interface DateRangeSelectorProps {
  value: IntervalloGiorni;
  onChange: (giorni: IntervalloGiorni) => void;
}

/**
 * Una riga sola, sopra tutti i grafici che condivide (mai un selettore per
 * grafico, cfr. skill dataviz "interaction.md" — filtra tutto ciò che sta
 * sotto, così i numeri restano coerenti tra loro). Limite 90 giorni
 * allineato al clamp server-side (GestioneAmministrazioneUtenti,
 * GIORNI_ANDAMENTO_MAX) — 7/30/90 sono valori ammessi per costruzione, non
 * serve validarli lato client.
 */
export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div role="group" aria-label="Intervallo temporale" className="flex gap-2">
      {OPZIONI.map((giorni) => (
        <button
          key={giorni}
          type="button"
          aria-pressed={value === giorni}
          onClick={() => onChange(giorni)}
          className={`rounded-md px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-wide transition-colors ${
            value === giorni ? "bg-accent text-asphalt" : "bg-surface-raised text-fog hover:text-paper"
          }`}
        >
          {giorni} giorni
        </button>
      ))}
    </div>
  );
}
