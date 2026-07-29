/**
 * Guard unico per le pagine fixture sotto /qa/* (usate solo dai test
 * Playwright per raggiungere stati altrimenti non innescabili da UI reale,
 * cfr. commenti nelle singole page.tsx). Non usa NODE_ENV: una build di
 * produzione (next build && next start, cfr. job "e2e" in ci.yml) non è lo
 * stesso concetto di "sono online sul dominio di produzione reale" — la
 * prima serve anche in CI per testare contro uno stack vicino al reale,
 * la seconda è l'unico caso da bloccare davvero. QA_FIXTURES_ENABLED è
 * esplicito: assente per default (= disabilitato, niente da fare in un vero
 * deploy), impostato a "true" in .env.local per lo sviluppo locale e nello
 * step che avvia il frontend nel job e2e di ci.yml.
 */
export function qaFixturesEnabled(): boolean {
  return process.env.QA_FIXTURES_ENABLED === "true";
}
