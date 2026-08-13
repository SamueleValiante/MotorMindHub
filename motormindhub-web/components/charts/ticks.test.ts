import { describe, expect, it } from "vitest";
import { generaTickAsseY } from "./ticks";

describe("generaTickAsseY", () => {
  it("range piccolo con interi (0-3): un tick per ogni intero, nessun duplicato dopo l'arrotondamento", () => {
    // Regressione: con 4 posizioni equidistanti calcolate indipendentemente
    // tra 0 e il massimo con margine (3.3), due cadevano su 1.5 e 2.25 —
    // Math.round le arrotondava entrambe a "2".
    const tick = generaTickAsseY(3, 4);
    const etichette = tick.map((v) => Math.round(v));

    expect(new Set(etichette).size).toBe(etichette.length);
    expect(etichette).toEqual([0, 1, 2, 3, 4]);
  });

  it("range più ampio (0-150): step 'nice' leggibile, non un valore arbitrario derivato da max/numTick", () => {
    const tick = generaTickAsseY(150, 4);

    expect(tick).toEqual([0, 50, 100, 150, 200]);
  });

  it("dati tutti a zero: nessun tick degenere/duplicato", () => {
    const tick = generaTickAsseY(0, 4);
    const etichette = tick.map((v) => Math.round(v));

    expect(new Set(etichette).size).toBe(etichette.length);
  });

  it("il massimo tick copre il picco con un margine visibile (mai il picco esattamente sull'ultimo tick)", () => {
    const picco = 3;
    const tick = generaTickAsseY(picco, 4);

    expect(tick[tick.length - 1]).toBeGreaterThan(picco);
  });

  it("verifica generale: nessun tick duplica (da arrotondato) il valore del tick precedente, per qualunque combinazione ragionevole di massimo e numero di tick desiderati", () => {
    for (let datiMax = 0; datiMax <= 500; datiMax += 1) {
      for (let numTick = 2; numTick <= 8; numTick += 1) {
        const tick = generaTickAsseY(datiMax, numTick);
        const etichette = tick.map((v) => Math.round(v));

        for (let i = 1; i < etichette.length; i += 1) {
          expect(etichette[i], `datiMax=${datiMax} numTick=${numTick} tick=${JSON.stringify(tick)}`).toBeGreaterThan(
            etichette[i - 1]
          );
        }
      }
    }
  });
});
