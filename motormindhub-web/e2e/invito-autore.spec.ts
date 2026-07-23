import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { inviteAuthorApi, waitForInviteToken } from "./helpers/test-authors";

const PASSWORD = "Sicura123!@#";

test.describe("Invito Autore", () => {
  // Stesso motivo di autore-bozze.spec.ts: il cookie banner intercetta i
  // click sui pulsanti in fondo alla pagina senza un consenso già deciso.
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("flusso completo: invito -> accettazione con password -> login come Autore (RF3.3, UC_8/UC_9)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const inviteeEmail = `e2e-invitato-${stamp}@example.com`;
    await inviteAuthorApi(manager.email, manager.password, {
      nome: "Invitata",
      cognome: "E2E",
      email: inviteeEmail,
      ruolo: "AUTORE",
    });
    const token = await waitForInviteToken(inviteeEmail);
    testUsers.trackForCleanup(inviteeEmail);

    await page.goto(`/inviti/${token}/accetta`);
    await expect(page.getByRole("heading", { name: "Sei stato invitato" })).toBeVisible();

    await page.getByRole("button", { name: "Accetta", exact: true }).click();
    await page.getByLabel("Scegli una password").fill(PASSWORD);
    await page.getByLabel("Conferma password").fill(PASSWORD);
    await page.getByRole("button", { name: "Conferma" }).click();

    await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();
    await expect(page.getByText("account è stato attivato")).toBeVisible();

    await page.getByRole("link", { name: "Vai al login" }).click();
    await page.waitForURL("**/login");

    await loginViaUi(page, inviteeEmail, PASSWORD);
    await page.waitForURL("**/autore");
  });

  test("rifiuto: nessun account viene creato (UC_10)", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const inviteeEmail = `e2e-rifiutato-${stamp}@example.com`;
    await inviteAuthorApi(manager.email, manager.password, {
      nome: "Rifiutata",
      cognome: "E2E",
      email: inviteeEmail,
      ruolo: "AUTORE",
    });
    const token = await waitForInviteToken(inviteeEmail);

    await page.goto(`/inviti/${token}/accetta`);
    await page.getByRole("button", { name: "Rifiuta", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();
    await expect(page.getByText("Invito rifiutato")).toBeVisible();

    const response = await page.request.post("http://localhost:8080/api/v1/auth/login", {
      data: { email: inviteeEmail, password: "IrrilevantePerchéNessunAccount1!" },
    });
    expect(response.status()).toBe(401);
  });

  test("link non valido o già usato: messaggio di errore dedicato (UC_9.1/UC_10.1)", async ({ page }) => {
    await page.goto("/inviti/token-e2e-inesistente/accetta");
    await expect(page.getByRole("heading", { name: "Sei stato invitato" })).toBeVisible();

    await page.getByRole("button", { name: "Rifiuta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Link non valido" })).toBeVisible();
  });

  test("responsive: la scelta e il form password restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const inviteeEmail = `e2e-mobile-invito-${stamp}@example.com`;
    await inviteAuthorApi(manager.email, manager.password, {
      nome: "Mobile",
      cognome: "E2E",
      email: inviteeEmail,
      ruolo: "AUTORE",
    });
    const token = await waitForInviteToken(inviteeEmail);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/inviti/${token}/accetta`);
    await expect(page.getByRole("heading", { name: "Sei stato invitato" })).toBeVisible();

    await page.getByRole("button", { name: "Accetta", exact: true }).click();
    await expect(page.getByLabel("Scegli una password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Conferma" })).toBeVisible();
  });
});
