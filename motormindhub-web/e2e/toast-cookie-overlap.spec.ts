import { test, expect } from "@playwright/test";

/**
 * Regressione: ToastViewport e CookieBanner sono entrambi elementi `fixed`
 * che rivendicano l'angolo in basso a sinistra dello schermo. Il fix in
 * ToastViewport (bottom-64 invece di bottom-4 quando il cookie banner è
 * visibile) evita che i toast finiscano nascosti sotto il banner. Non un
 * confronto pixel-per-pixel: solo un assert sui bounding box renderizzati.
 */
test("il toast non si sovrappone al cookie banner quando entrambi sono visibili", async ({
  page,
}) => {
  // Browser context pulito: nessun cookie di consenso già deciso, quindi il
  // cookie banner compare di default.
  await page.goto("/qa/toast-cookie-overlap");

  const cookieBanner = page.getByTestId("cookie-banner");
  await expect(cookieBanner).toBeVisible();

  await page.getByRole("button", { name: "Mostra toast" }).click();
  const toastViewport = page.getByTestId("toast-viewport");
  await expect(toastViewport).toBeVisible();

  const toastBox = await toastViewport.boundingBox();
  const bannerBox = await cookieBanner.boundingBox();
  expect(toastBox).not.toBeNull();
  expect(bannerBox).not.toBeNull();

  const toastBottom = toastBox!.y + toastBox!.height;
  const bannerTop = bannerBox!.y;

  // Nessuna sovrapposizione verticale: il riquadro dei toast deve finire
  // sopra l'inizio del banner (o viceversa), mai intersecarsi.
  const noVerticalOverlap =
    toastBottom <= bannerTop || bannerBox!.y + bannerBox!.height <= toastBox!.y;

  expect(noVerticalOverlap).toBe(true);
});
