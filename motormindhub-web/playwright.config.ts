import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  // Seriale, non il default basato sui core: questi test condividono un
  // singolo dev server Next.js (compilazione on-demand di Turbopack) e lo
  // stesso backend/DB reali, non sono unit test isolati. Verificato dal
  // vivo che con più worker paralleli il dev server rallenta abbastanza da
  // far vincere talvolta la sottomissione nativa del form (GET, credenziali
  // in query string) sull'hydration React del listener onSubmit — un
  // sintomo del carico di test irrealistico, non riprodotto in esecuzione
  // seriale. Non è comunque da escludere come rischio teorico in
  // produzione su una connessione client molto lenta: da tenere presente.
  workers: 1,
  // In CI (vedi job "e2e" in ci.yml) i fallimenti dovuti a pressione di risorse sul runner
  // condiviso sono lo stesso fenomeno di flakiness già diagnosticato in locale (timeout email/
  // pagina Chromium OOM su swap, non un bug) - il retry nativo compensa quello senza mascherare
  // regressioni reali, che falliscono in modo consistente anche al retry.
  retries: process.env.CI ? 2 : 0,
  // Reporter di default ("list") non scrive alcun file: in CI serve un report ispezionabile dopo
  // i fatti (il job "e2e" lo carica come artifact), "open: never" perché non c'è un browser
  // interattivo sul runner ad aprirlo.
  reporter: process.env.CI ? [["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // true (non condizionato a !process.env.CI): in ci.yml il job "e2e" builda ed avvia il
    // frontend in produzione (npm run build + npm start) PRIMA di lanciare Playwright, apposta
    // per evitare compilazione on-demand/StrictMode del dev server sotto carico - qui basta
    // riusare quel server già in ascolto su :3000, non avviarne un secondo con "npm run dev" che
    // andrebbe in conflitto di porta. In locale, senza un server già attivo, il comportamento
    // resta invariato: Playwright lo avvia comunque con "npm run dev".
    reuseExistingServer: true,
    timeout: 30000,
  },
});
