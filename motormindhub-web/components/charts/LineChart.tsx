"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { generaTickAsseY } from "./ticks";

export interface LineChartSeries {
  key: string;
  label: string;
  /** Valore CSS del colore (es. "var(--color-accent)") — mai un token di testo, cfr. skill dataviz. */
  color: string;
  /**
   * Un punto per giorno, densità uniforme (nessun buco): tutti gli endpoint
   * andamento-* del backend fanno zero-fill lato server, la posizione X qui
   * è quindi calcolata per indice, non per data reale — se in futuro un
   * endpoint smettesse di garantirlo, questo componente andrebbe rivisto.
   */
  points: { data: string; valore: number }[];
}

interface LineChartProps {
  series: LineChartSeries[];
  /** Riassunto testuale del grafico per screen reader (es. "Andamento visite, ultimi 30 giorni"). */
  ariaLabel: string;
  height?: number;
}

const VIEWBOX_WIDTH = 640;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 40 };
const GRID_STEPS = 4;

function formatDataBreve(iso: string): string {
  const [, mese, giorno] = iso.split("-");
  return `${giorno}/${mese}`;
}

function formatDataCompleta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Grafico a linee SVG, senza dipendenze esterne (cfr. piano concordato:
 * scope contenuto, zero librerie di charting nuove in un progetto che oggi
 * non ne ha nessuna). Segue la spec della skill dataviz: linee 2px round
 * cap, marker di fine ≥8px, crosshair+tooltip su hover/focus con lo stesso
 * dettaglio, legenda solo da 2 serie in su (mai colore-solo), vista
 * tabellare alternativa sempre disponibile (il gemello di accessibilità
 * di ogni grafico).
 *
 * Asse X per indice (non per data reale): valido perché ogni chiamante
 * riceve dati già zero-fillati giorno per giorno dal backend (vedi
 * `points` sopra) — niente scala temporale vera, niente buchi da gestire.
 */
export function LineChart({ series, ariaLabel, height = 240 }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const pointCount = series[0]?.points.length ?? 0;
  const plotWidth = VIEWBOX_WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  // I tick (e quindi anche il massimo dell'asse) vengono da generaTickAsseY,
  // non da un max calcolato qui: lo step "nice" e il margine sopra il picco
  // sono la stessa funzione, cfr. components/charts/ticks.ts.
  const gridValues = useMemo(() => {
    const datiMax = Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.valore)));
    return generaTickAsseY(datiMax, GRID_STEPS);
  }, [series]);
  const maxValue = gridValues[gridValues.length - 1];

  const xForIndex = (index: number): number =>
    pointCount <= 1 ? MARGIN.left : MARGIN.left + (index / (pointCount - 1)) * plotWidth;

  const yForValue = (value: number): number =>
    MARGIN.top + plotHeight - (value / maxValue) * plotHeight;

  const pathFor = (points: { valore: number }[]): string =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${xForIndex(i)} ${yForValue(p.valore)}`).join(" ");

  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (pointCount - 1));
    setHoverIndex(Math.min(pointCount - 1, Math.max(0, index)));
  };

  const moveFocus = (delta: number) => {
    setHoverIndex((current) => {
      const base = current ?? 0;
      return Math.min(pointCount - 1, Math.max(0, base + delta));
    });
  };

  const xLabelIndexes =
    pointCount <= 1 ? [0] : [0, Math.round((pointCount - 1) / 2), pointCount - 1];

  const tooltipData = hoverIndex !== null ? series[0]?.points[hoverIndex]?.data : null;
  const tooltipLeftPercent =
    hoverIndex !== null && pointCount > 1 ? (hoverIndex / (pointCount - 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        {series.length > 1 && (
          <ul className="flex flex-wrap gap-4">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs text-fog">
                <span
                  aria-hidden="true"
                  className="h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto shrink-0 font-heading text-xs font-bold uppercase tracking-wide text-accent"
        >
          {showTable ? "Vedi come grafico" : "Vedi come tabella"}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{ariaLabel}</caption>
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th scope="col" className="py-2 pr-4 font-normal">
                  Data
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="py-2 pr-4 font-normal">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series[0]?.points.map((point, i) => (
                <tr key={point.data} className="border-b border-paper/5 last:border-0">
                  <td className="py-2 pr-4 text-fog">{formatDataCompleta(point.data)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-2 pr-4 font-mono text-paper">
                      {s.points[i]?.valore ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          {/*
            Niente role="img" qui: lo svg contiene un elemento interattivo
            (lo slider sotto), e role="img" vieta discendenti interattivi
            (axe-core "nested-interactive" — verificato dal vivo). La
            semantica del grafico la porta lo slider stesso, via
            aria-label/aria-valuetext — non aria-hidden sull'svg, altrimenti
            nasconderebbe anche lo slider che deve restare raggiungibile.
          */}
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
            width="100%"
            height={height}
            className="overflow-visible"
          >
            {gridValues.map((value) => (
              <g key={value}>
                <line
                  x1={MARGIN.left}
                  x2={VIEWBOX_WIDTH - MARGIN.right}
                  y1={yForValue(value)}
                  y2={yForValue(value)}
                  stroke="var(--color-chrome)"
                  strokeOpacity={0.15}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={yForValue(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-fog font-mono text-[10px]"
                >
                  {Math.round(value)}
                </text>
              </g>
            ))}

            {xLabelIndexes.map((index) => (
              <text
                key={index}
                x={xForIndex(index)}
                y={height - 8}
                textAnchor={index === 0 ? "start" : index === pointCount - 1 ? "end" : "middle"}
                className="fill-fog font-mono text-[10px]"
              >
                {series[0]?.points[index] ? formatDataBreve(series[0].points[index].data) : ""}
              </text>
            ))}

            {hoverIndex !== null && (
              <line
                x1={xForIndex(hoverIndex)}
                x2={xForIndex(hoverIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
                stroke="var(--color-chrome)"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            )}

            {series.map((s) => (
              <g key={s.key}>
                <path d={pathFor(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {hoverIndex !== null && s.points[hoverIndex] && (
                  <circle
                    cx={xForIndex(hoverIndex)}
                    cy={yForValue(s.points[hoverIndex].valore)}
                    r={5}
                    fill={s.color}
                  />
                )}
              </g>
            ))}

            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              role="slider"
              aria-label={`${ariaLabel} — usa le frecce per scorrere i giorni`}
              aria-valuemin={0}
              aria-valuemax={pointCount - 1}
              aria-valuenow={hoverIndex ?? pointCount - 1}
              aria-valuetext={
                hoverIndex !== null && series[0]?.points[hoverIndex]
                  ? `${formatDataCompleta(series[0].points[hoverIndex].data)}: ${series
                      .map((s) => `${s.label} ${s.points[hoverIndex]?.valore ?? 0}`)
                      .join(", ")}`
                  : undefined
              }
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex((current) => current ?? pointCount - 1)}
              onBlur={() => setHoverIndex(null)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveFocus(1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveFocus(-1);
                }
              }}
              className="cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </svg>

          {hoverIndex !== null && tooltipData && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-paper/10 bg-asphalt px-3 py-2 text-xs shadow-lg"
              style={{ left: `${tooltipLeftPercent}%` }}
            >
              <p className="mb-1 font-heading font-bold text-paper">{formatDataCompleta(tooltipData)}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center gap-2 text-fog">
                  <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-mono font-bold text-paper">{s.points[hoverIndex]?.valore ?? 0}</span>
                  <span>{s.label}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
