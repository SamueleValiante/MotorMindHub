import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { getUserId, waitForEmailToken } from "./helpers/test-users";

const PASSWORD = "Sicura123!@#";

test.describe("Panoramica / Impostazioni profilo", () => {
  test("flusso completo: registrazione -> verifica -> login -> Panoramica reale -> modifica profilo", async ({
    page,
    testUsers,
  }) => {
    const email = `e2e-${test.info().testId}-${Date.now()}@example.com`;
    testUsers.trackForCleanup(email);

    await page.goto("/registrazione");
    // Contesto pulito, nessuna decisione di consenso presa: come un vero
    // primo visitatore, va smaltito prima di proseguire (altrimenti resta
    // visivamente sopra ai controlli in fondo alle pagine più lunghe di
    // questo flusso, es. "Salva modifiche" in Impostazioni).
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    await page.getByLabel("Nome", { exact: true }).fill("Marco");
    await page.getByLabel("Cognome").fill("Verdi");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByText("Accetto i Termini di Servizio").click();
    await page.getByRole("button", { name: "Crea account" }).click();
    await expect(page.getByText("Controlla la tua email")).toBeVisible();

    const token = await waitForEmailToken(email, "Conferma");
    await page.goto(`/conferma-email?token=${token}`);
    await expect(page.getByRole("heading", { name: "Account attivato" })).toBeVisible();

    // Login -> il redirect post-login punta a /account: prima di questo
    // punto era una pagina inesistente (nessun page.tsx), qui verifichiamo
    // che ora atterri su una Panoramica reale, non su un vuoto/404.
    await loginViaUi(page, email, PASSWORD);
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Ciao, Marco" })).toBeVisible();
    await expect(page.getByText("Iscritto dal")).toBeVisible();
    await expect(page.getByRole("main").getByText("Marco Verdi")).toBeVisible();
    await expect(page.getByRole("main").getByText(email)).toBeVisible();

    await page.getByRole("link", { name: "Modifica profilo" }).click();
    await expect(page).toHaveURL(/\/account\/impostazioni$/);

    // Prefill reale da GET /utenti/me.
    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Marco");
    await expect(page.getByLabel("Cognome")).toHaveValue("Verdi");
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await expect(page.getByLabel("Email")).toBeDisabled();

    await page.getByLabel("Nome", { exact: true }).fill("Marco Antonio");
    await page.getByLabel("Biografia").fill("Appassionato di motori aspirati.");
    await page.getByRole("button", { name: "Salva modifiche" }).click();

    await expect(page.getByText("Profilo aggiornato con successo.")).toBeVisible();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Ciao, Marco Antonio" })).toBeVisible();
    await expect(page.getByRole("main").getByText("Marco Antonio Verdi")).toBeVisible();
  });
});

test.describe("Profilo pubblico utente", () => {
  test("mostra i dati di PublicProfileDTO e permette di segnalare l'utente", async ({
    page,
    testUsers,
  }) => {
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await loginViaUi(page, reporter.email, reporter.password);
    await page.goto(`/utenti/${targetId}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "E2E Test" })).toBeVisible();
    await expect(
      page.getByText("Questo utente non ha ancora scritto una biografia.")
    ).toBeVisible();

    await page.getByRole("button", { name: "Segnala profilo" }).click();
    await expect(
      page.getByRole("heading", { name: `Segnala il profilo di "E2E Test"` })
    ).toBeVisible();

    await page.getByLabel("Motivazione").fill("Contenuti offensivi nel profilo.");
    await page.getByRole("button", { name: "Invia segnalazione" }).click();

    await expect(
      page.getByText("Segnalazione inviata. Il team di moderazione la esaminera' a breve.")
    ).toBeVisible();
  });

  test("profilo non trovato: messaggio dedicato invece di un errore silenzioso", async ({
    page,
  }) => {
    await page.goto("/utenti/99999999", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Profilo non trovato" })).toBeVisible();
  });

  test("sul proprio profilo pubblico il pulsante Segnala non è mostrato", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create();
    const { uid } = await loginViaUi(page, user.email, user.password);

    await page.goto(`/utenti/${uid}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "E2E Test" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Segnala profilo" })).not.toBeVisible();
  });
});
