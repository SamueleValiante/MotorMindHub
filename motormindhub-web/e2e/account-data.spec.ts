import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { waitForDataExportEmail } from "./helpers/test-users";

test.describe("I miei dati / Esportazione", () => {
  test("mostra i dati reali dell'utente e invia l'esportazione via email con allegato", async ({
    page,
    testUsers,
  }) => {
    const { email, password } = await testUsers.create();

    await loginViaUi(page, email, password);
    await page.goto("/account/dati", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Nome, cognome, email")).toBeVisible();

    await page.getByRole("button", { name: "Esporta dati" }).click();
    await expect(
      page.getByText("Riceverai a breve un'email con i tuoi dati personali in allegato, in formato JSON.")
    ).toBeVisible();

    const exportEmail = await waitForDataExportEmail(email);
    expect(exportEmail.subject).toBe("I tuoi dati personali sono pronti");
    expect(exportEmail.attachments).toBeGreaterThan(0);
  });
});

test.describe("Elimina account", () => {
  test("richiede conferma esplicita, poi mostra che la richiesta è in coda (nessun logout)", async ({
    page,
    testUsers,
  }) => {
    const { email, password } = await testUsers.create();

    await loginViaUi(page, email, password);
    await page.goto("/account/elimina", { waitUntil: "domcontentloaded" });

    const deleteButton = page.getByRole("button", {
      name: "Elimina definitivamente il mio account",
    });
    await expect(deleteButton).toBeDisabled();

    await page.getByText("Ho compreso che l'operazione è irreversibile").click();
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(page.getByRole("heading", { name: "Richiesta presa in carico" })).toBeVisible();

    // Nessun logout automatico: verificato che la sessione resta valida,
    // si può ancora navigare liberamente nell'area protetta.
    await page.goto("/account/dati", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Data registrazione")).toBeVisible();
  });

  test("richiesta duplicata: messaggio di errore specifico dal backend", async ({
    page,
    testUsers,
  }) => {
    const { email, password } = await testUsers.create();

    await loginViaUi(page, email, password);
    await page.goto("/account/elimina", { waitUntil: "domcontentloaded" });
    await page.getByText("Ho compreso che l'operazione è irreversibile").click();
    await page
      .getByRole("button", { name: "Elimina definitivamente il mio account" })
      .click();
    await expect(page.getByRole("heading", { name: "Richiesta presa in carico" })).toBeVisible();

    // Il form riappare rinavigando (stato locale React, non persistito):
    // un secondo tentativo reale colpisce il backend, che risponde 409.
    await page.goto("/account/elimina", { waitUntil: "domcontentloaded" });
    await page.getByText("Ho compreso che l'operazione è irreversibile").click();
    await page
      .getByRole("button", { name: "Elimina definitivamente il mio account" })
      .click();

    await expect(
      page.getByText("Esiste gia' una richiesta di cancellazione attiva per questo account.")
    ).toBeVisible();
  });
});
