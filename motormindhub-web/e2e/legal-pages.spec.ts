import { test, expect } from "./fixtures";

test.describe("Pagine legali statiche", () => {
  test("il link Cookie Policy dentro il cookie banner porta davvero li'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("cookie-banner")).toBeVisible();

    await page.getByTestId("cookie-banner").getByRole("link", { name: "Cookie Policy" }).click();
    await expect(page).toHaveURL(/\/cookie-policy$/);
    await expect(page.getByRole("heading", { name: "Cookie Policy" })).toBeVisible();
  });

  test("i 5 link legali del footer portano davvero alle rispettive pagine", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();
    const footer = page.getByRole("contentinfo");

    await footer.getByRole("link", { name: "Termini e Condizioni" }).click();
    await expect(page).toHaveURL(/\/termini$/);
    await expect(page.getByRole("heading", { name: "Termini e Condizioni d'Uso" })).toBeVisible();

    await page.goto("/");
    await footer.getByRole("link", { name: "Cookie Policy" }).click();
    await expect(page).toHaveURL(/\/cookie-policy$/);
    await expect(page.getByRole("heading", { name: "Cookie Policy" })).toBeVisible();

    await page.goto("/");
    await footer.getByRole("link", { name: "Informativa Privacy" }).click();
    await expect(page).toHaveURL(/\/informativa-privacy$/);
    await expect(page.getByRole("heading", { name: "Informativa Privacy" })).toBeVisible();

    await page.goto("/");
    await footer.getByRole("link", { name: "Accessibilità" }).click();
    await expect(page).toHaveURL(/\/accessibilita$/);
    await expect(page.getByRole("heading", { name: "Dichiarazione di Accessibilità" })).toBeVisible();

    await page.goto("/");
    await footer.getByRole("link", { name: "Chi siamo" }).click();
    await expect(page).toHaveURL(/\/chi-siamo$/);
    await expect(
      page.getByRole("heading", { name: "La conoscenza automotive, senza rumore di fondo." })
    ).toBeVisible();
  });

  test("il link Chi Siamo nella nav dell'header porta davvero li'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();
    await page.getByRole("banner").getByRole("link", { name: "Chi Siamo" }).click();
    await expect(page).toHaveURL(/\/chi-siamo$/);
  });

  test("Preferenze cookie nel footer riapre davvero il banner dopo una decisione", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();
    await expect(page.getByTestId("cookie-banner")).not.toBeVisible();

    await page.getByRole("contentinfo").getByRole("button", { name: "Preferenze cookie" }).click();
    await expect(page.getByTestId("cookie-banner")).toBeVisible();
  });
});
