import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";

test.describe("Accesso a /account per ruoli esclusi dai self-service", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("un GESTORE_UTENTI che naviga a /account viene rimandato alla propria dashboard, non a una pagina rotta (RAD 3.4.2)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/account");

    await page.waitForURL("**/gestore");
    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();
  });
});
