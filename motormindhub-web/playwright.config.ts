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
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
