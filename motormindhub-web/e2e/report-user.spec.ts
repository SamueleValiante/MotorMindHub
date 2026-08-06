import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { getUserId } from "./helpers/test-users";

test.describe("Form segnalazione", () => {
  test("utente non autenticato: redirect al login, nessun errore silenzioso", async ({ page }) => {
    await page.goto("/qa/report-user?segnalatoId=1&segnalatoNome=Test");
    await page.getByRole("button", { name: "Segnala profilo" }).click();

    await expect(page).toHaveURL(/\/login\?redirectTo=/);
  });

  test("submit riuscito: toast di conferma", async ({ page, testUsers }) => {
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await loginViaUi(page, reporter.email, reporter.password);
    await page.goto(
      `/qa/report-user?segnalatoId=${targetId}&segnalatoNome=${encodeURIComponent(target.email)}`,
      { waitUntil: "domcontentloaded" }
    );

    await page.getByRole("button", { name: "Segnala profilo" }).click();
    await expect(
      page.getByRole("heading", { name: `Segnala il profilo di "${target.email}"` })
    ).toBeVisible();

    await page.getByLabel("Motivazione").fill("Contenuti offensivi nel profilo.");
    await page.getByRole("button", { name: "Invia segnalazione" }).click();

    await expect(
      page.getByText("Segnalazione inviata. Il team di moderazione la esaminera' a breve.")
    ).toBeVisible();
  });

  test("segnalare se stessi: bloccato dal backend", async ({ page, testUsers }) => {
    const user = await testUsers.create();
    const { uid } = await loginViaUi(page, user.email, user.password);

    await page.goto(`/qa/report-user?segnalatoId=${uid}&segnalatoNome=${encodeURIComponent(user.email)}`, {
      waitUntil: "domcontentloaded",
    });

    await page.getByRole("button", { name: "Segnala profilo" }).click();
    await page.getByLabel("Motivazione").fill("Test auto-segnalazione.");
    await page.getByRole("button", { name: "Invia segnalazione" }).click();

    await expect(
      page.getByText("Non e' possibile segnalare il proprio stesso profilo.")
    ).toBeVisible();
  });

  test("annulla: chiude il modale senza inviare nulla", async ({ page, testUsers }) => {
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await loginViaUi(page, reporter.email, reporter.password);
    await page.goto(`/qa/report-user?segnalatoId=${targetId}`, { waitUntil: "domcontentloaded" });

    // Nome scoped esplicitamente: senza consenso cookie deciso in questo test
    // (a differenza degli altri in questo file) il CookieBanner è visibile ed
    // è anch'esso un role="dialog" (cfr. useFocusTrap) — un selettore nudo
    // risulterebbe ambiguo tra i due.
    const reportDialog = page.getByRole("dialog", { name: /Segnala il profilo/ });
    await page.getByRole("button", { name: "Segnala profilo" }).click();
    await expect(reportDialog).toBeVisible();

    await page.getByRole("button", { name: "Annulla" }).click();
    await expect(reportDialog).not.toBeVisible();
  });
});
