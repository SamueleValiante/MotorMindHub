/**
 * Genera i tick dell'asse Y con lo step "nice number" standard (1/2/5/10 ×
 * potenza di 10), non un numero fisso di posizioni equidistanti tra 0 e il
 * massimo. Bug corretto (dashboard Gestore Utenti, grafico "Andamento
 * registrazioni"): con GRID_STEPS+1 posizioni equidistanti calcolate e
 * arrotondate indipendentemente, un range stretto (es. 0-3 con margine) le
 * faceva cadere su valori come 0.75/1.5/2.25 — Math.round ne arrotondava
 * due (1.5 e 2.25) allo stesso intero "2", producendo un'etichetta
 * duplicata con spaziatura visiva diversa dalle altre.
 *
 * `datiMax` è sempre un conteggio non negativo (visite/registrazioni, mai
 * frazionario) in tutti e 3 i grafici che usano questo componente: lo step
 * è quindi forzato a un minimo di 1 — uno step "nice" da 0.5 sarebbe
 * comunque una posizione senza senso per un dato intero e produrrebbe lo
 * stesso tipo di duplicato dopo l'arrotondamento in fase di rendering.
 */
export function generaTickAsseY(datiMax: number, numTickDesiderati: number): number[] {
  const massimoConMargine = datiMax <= 0 ? 1 : datiMax * 1.1;
  const stepGrezzo = massimoConMargine / numTickDesiderati;
  const magnitudine = 10 ** Math.floor(Math.log10(stepGrezzo));
  const residuo = stepGrezzo / magnitudine;
  const residuoNice = residuo <= 1 ? 1 : residuo <= 2 ? 2 : residuo <= 5 ? 5 : 10;
  const step = Math.max(1, residuoNice * magnitudine);

  const numTick = Math.ceil(massimoConMargine / step) + 1;
  return Array.from({ length: numTick }, (_, i) => i * step);
}
