import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import type { TestRuolo } from "./fixtures";

const AREAS: { ruolo: TestRuolo; path: string; heading: string }[] = [
  { ruolo: "ISCRITTO", path: "/account", heading: "Ciao, E2E" },
  { ruolo: "AUTORE", path: "/autore", heading: "Dashboard" },
  { ruolo: "MANAGER_AUTORI", path: "/manager", heading: "Dashboard Manageriale" },
  { ruolo: "GESTORE_UTENTI", path: "/gestore", heading: "Dashboard Gestione Utenti" },
];

/**
 * Regressione per un bug osservato dal vivo (sessione RoleGuard, sera del
 * 12/08): un errore transitorio (5xx, rete) durante il refresh silenzioso
 * al mount (AuthProvider -> ensureFreshAccessToken) veniva trattato come
 * "sessione non rinnovabile" e forzava lo stato "anonymous" -> RoleGuard
 * reindirizzava a /login pur avendo il refresh token ancora perfettamente
 * valido nel cookie httpOnly (mmh_rt). Non era una race di RoleGuard (che
 * aspetta correttamente status !== "loading" prima di decidere, verificato
 * per tutti e 4 i gruppi protetti) - la causa reale era in
 * lib/auth/refresh.ts e app/api/auth/refresh/route.ts, che non
 * distinguevano un 401 esplicito (RefreshTokenNonValidoException lato
 * backend: unico caso in cui la sessione è davvero da buttare) da un
 * qualunque altro fallimento (backend momentaneamente giù, 5xx, errore di
 * rete), trattati entrambi come logout.
 *
 * Il sintomo "torna alla home" della sidebar che portava alla home
 * pubblica invece che alla dashboard del ruolo (segnalato separatamente)
 * era una CONSEGUENZA di questo bug, non una regressione della sidebar:
 * una volta finiti su /login (layout condiviso, logo -> "/" sempre, cfr.
 * app/(auth)/layout.tsx e auth-layout.spec.ts) non si è più sulla sidebar
 * del ruolo. sidebar-torna-alla-home.spec.ts resta verde 4/4 perché non
 * testa questo scenario, non perché il bug non esistesse.
 */
test.describe("Reload su un'area protetta con sessione valida non disconnette l'utente", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  for (const { ruolo, path, heading } of AREAS) {
    test(`${ruolo}: reload su ${path} non reindirizza a /login`, async ({ page, testUsers }) => {
      const user = await testUsers.create(ruolo === "ISCRITTO" ? undefined : { ruolo });

      await loginViaUi(page, user.email, user.password);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();

      await page.reload({ waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      expect(page.url()).not.toContain("/login");
    });
  }

  test("un 503 transitorio su /api/auth/refresh durante il reload non forza il logout (refresh token ancora valido)", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    await loginViaUi(page, user.email, user.password);
    await page.goto("/gestore", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();

    let intercepted = false;
    await page.route("**/api/auth/refresh", async (route) => {
      if (!intercepted) {
        intercepted = true;
        await route.fulfill({ status: 503, body: "Service Unavailable" });
      } else {
        await route.continue();
      }
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();
    expect(page.url()).not.toContain("/login");
    expect(intercepted).toBe(true);
  });

  test("una sessione davvero non rinnovabile (401 dal backend) continua a rimandare a /login", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    await loginViaUi(page, user.email, user.password);
    await page.goto("/gestore", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();

    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ message: "Sessione non valida." }) })
    );

    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForURL("**/login**", { timeout: 5000 });
  });
});
