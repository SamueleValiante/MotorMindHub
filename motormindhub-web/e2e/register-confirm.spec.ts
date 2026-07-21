import { test, expect } from "./fixtures";

const PASSWORD = "Sicura123!@#";

test.describe("Registrazione", () => {
  test("submit riuscito: mostra 'controlla la tua email', nessun redirect automatico", async ({
    page,
    testUsers,
  }) => {
    const email = `e2e-${test.info().testId}-${Date.now()}@example.com`;
    testUsers.trackForCleanup(email);

    await page.goto("/registrazione");
    await page.getByLabel("Nome", { exact: true }).fill("E2E");
    await page.getByLabel("Cognome").fill("Registrazione");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByText("Accetto i Termini di Servizio").click();
    await page.getByRole("button", { name: "Crea account" }).click();

    await expect(page.getByText("Controlla la tua email")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page).toHaveURL(/\/registrazione$/);
  });

  test("email già registrata: toast di errore, resta sul form", async ({ page, testUsers }) => {
    const { email } = await testUsers.create();

    await page.goto("/registrazione");
    await page.getByLabel("Nome", { exact: true }).fill("E2E");
    await page.getByLabel("Cognome").fill("Duplicato");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByText("Accetto i Termini di Servizio").click();
    await page.getByRole("button", { name: "Crea account" }).click();

    await expect(page.getByText("Un account con questo indirizzo email esiste gia'.")).toBeVisible();
    // Resta sul form (non è passato alla vista "controlla la tua email").
    await expect(page.getByRole("button", { name: "Crea account" })).toBeVisible();
  });
});

test.describe("Conferma email", () => {
  test("token valido: successo e link al login", async ({ page, testUsers }) => {
    const { verificationToken } = await testUsers.create({ unverified: true });

    await page.goto(`/conferma-email?token=${verificationToken}`);

    await expect(page.getByRole("heading", { name: "Account attivato" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vai al login" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("token già usato: messaggio di link non valido", async ({ page, testUsers }) => {
    const { verificationToken } = await testUsers.create({ unverified: true });

    // Consuma il token una prima volta (come se l'utente avesse già cliccato il link).
    await fetch(`http://localhost:8080/api/v1/utenti/verifica-email?token=${verificationToken}`);

    await page.goto(`/conferma-email?token=${verificationToken}`);

    await expect(
      page.getByText("Il link di verifica non e' valido o e' gia' stato utilizzato.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Torna al login" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("token inesistente: stesso messaggio di link non valido", async ({ page }) => {
    // Nota: il backend non ha un concetto di scadenza temporale per questo
    // token (nessun campo di scadenza su Utente.tokenVerifica) - un token
    // "scaduto" e un token mai esistito producono lo stesso
    // TokenNonValidoException, verificato a codice in GestioneUtenti.verifyEmail.
    await page.goto("/conferma-email?token=token-mai-esistito-123");

    await expect(
      page.getByText("Il link di verifica non e' valido o e' gia' stato utilizzato.")
    ).toBeVisible();
  });

  test("token assente dalla query string: messaggio dedicato", async ({ page }) => {
    await page.goto("/conferma-email");

    await expect(page.getByText("Link di conferma non valido: manca il token.")).toBeVisible();
  });

  /**
   * Regressione: bug gemello di quello trovato in useArticle/
   * useEditableArticle. ConfirmEmailContent usa la stessa guardia "già
   * richiesto" (ora requestedTokenRef) per non consumare due volte il
   * token monouso — ma la cancellazione era legata a un flag `cancelled`
   * locale all'effetto, impostato a true dalla cleanup sincrona del replay
   * mount -> cleanup -> mount di StrictMode: la guardia impediva al
   * remount di avviare una seconda verifica, quindi l'UNICA fetch rimasta
   * in volo veniva sempre scartata al suo arrivo, bloccando la pagina su
   * "Verifica in corso…" per sempre.
   *
   * I test sopra (con page.goto diretto) non lo intercettano: un hard
   * navigation non riproduce il bug, serve una navigazione client-side (un
   * <Link> dell'App Router già montato) — nel mondo reale il rischio è
   * comunque basso, dato che si arriva quasi sempre qui da un link email
   * esterno, ma nessuna pagina reale linka a /conferma-email per
   * verificarlo altrimenti: /qa/link-to-conferma-email esiste solo per
   * questo test (stesso schema di /qa/toast-cookie-overlap, /qa/report-user).
   *
   * Oltre all'esito finale, verifica che la chiamata reale a verifica-email
   * avvenga esattamente una volta: è il punto che conta davvero per un
   * token monouso — un fix che nasconde la UI bloccata ma richiama
   * l'endpoint due volte consumerebbe comunque il token alla prima e
   * fallirebbe silenziosamente alla seconda (o peggio, in un'API non
   * idempotente diversa da questa, produrrebbe un doppio effetto reale).
   */
  test("navigazione client-side (Link) verso /conferma-email: verifica avviene una sola volta, nessun blocco su Verifica in corso (strict-mode)", async ({
    page,
    testUsers,
  }) => {
    const { verificationToken } = await testUsers.create({ unverified: true });

    let verifyCalls = 0;
    await page.route("**/api/v1/utenti/verifica-email**", (route) => {
      verifyCalls++;
      return route.continue();
    });

    await page.goto(`/qa/link-to-conferma-email?token=${verificationToken}`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("link", { name: "Vai alla conferma email" }).click();
    await page.waitForURL(/\/conferma-email/);

    await expect(page.getByRole("heading", { name: "Account attivato" })).toBeVisible();
    await expect(page.getByText("Verifica in corso…")).not.toBeVisible();
    expect(verifyCalls).toBe(1);
  });
});
