import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createDraftArticle, deleteDraftArticle, setArticleCoverImage } from "./helpers/test-articles";
import { validPng, oversizedImage, overAvatarLimitImage, unsupportedFormatFile } from "./helpers/test-images";

test.describe("Upload immagini (foto profilo + copertina articolo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  // Un solo utente/login per tutti gli scenari (successo + i tre casi di
  // errore): RateLimitFilter limita registrazione+verifica-email a 8
  // richieste/minuto per IP - un utente per scenario (4) ne consumerebbe 8
  // da solo, a rischio di far scattare il limite insieme al resto della
  // suite. Stesso stile sequenziale già usato altrove per un flusso di
  // azioni concatenate (cfr. gestore-gestione-account.spec.ts, sospendi ->
  // riattiva -> esporta in un solo test).
  test("Impostazioni Profilo: upload reale, poi i tre casi di errore (413/400 dimensione/400 formato)", async ({
    page,
    testUsers,
  }) => {
    const iscritto = await testUsers.create();
    const fileInput = () => page.locator('input[type="file"]');

    await loginViaUi(page, iscritto.email, iscritto.password);
    await page.goto("/account/impostazioni");

    // Upload valido: la preview passa da un blob: locale all'URL Cloudinary
    // restituito dal backend - la conferma che l'upload (non solo la
    // selezione del file) è andato a buon fine.
    await fileInput().setInputFiles(validPng());
    const avatarImg = page.locator("img").first();
    await expect(avatarImg).toHaveAttribute("src", /^https?:\/\//, { timeout: 15000 });

    await page.getByRole("button", { name: "Salva modifiche" }).click();
    await expect(page).toHaveURL(/\/account$/);

    // Persistito lato backend, non solo nello stato locale del form.
    await page.goto("/account/impostazioni");
    await expect(page.locator("img").first()).toHaveAttribute("src", /^https?:\/\//);

    // File oltre il ceiling globale servlet (6MB) -> 413.
    await fileInput().setInputFiles(oversizedImage());
    await expect(page.getByText("Il file caricato supera la dimensione massima consentita.")).toBeVisible();

    // File oltre il limite applicativo dell'avatar (2MB) ma sotto il ceiling globale -> 400.
    await fileInput().setInputFiles(overAvatarLimitImage());
    await expect(
      page.getByText("Il file supera la dimensione massima consentita (2 MB).")
    ).toBeVisible();

    // Content-Type fuori whitelist JPEG/PNG/WEBP -> 400.
    await fileInput().setInputFiles(unsupportedFormatFile());
    await expect(
      page.getByText("Formato non supportato. Sono ammessi solo immagini JPEG, PNG o WEBP.")
    ).toBeVisible();
  });

  test("Editor Articolo: un URL di copertina storico (pre-Cloudinary) resta visibile in preview, e può essere sostituito con un upload reale", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const urlStorico = `https://storico-esterno.example.com/copertine/${stamp}.jpg`;
    const id = await createDraftArticle(autore.email, autore.password, {
      titolo: `Articolo con copertina storica ${stamp}`,
      categoriaNome: `Categoria copertina storica ${stamp}`,
    });

    try {
      await setArticleCoverImage(id, urlStorico);

      await loginViaUi(page, autore.email, autore.password);
      await page.goto(`/autore/articoli/${id}/modifica`);

      // L'URL storico non è mai passato da Cloudinary: deve comunque
      // comparire in preview, nessuna logica speciale nel frontend.
      await expect(page.locator(`img[src="${urlStorico}"]`)).toBeVisible();

      await page.locator('input[type="file"]').setInputFiles(validPng());
      await expect(page.locator(`img[src="${urlStorico}"]`)).toHaveCount(0);
      await expect(page.locator("img").first()).toHaveAttribute("src", /^https?:\/\//, { timeout: 15000 });

      await page.getByRole("button", { name: "Salva bozza" }).click();
      await expect(page.getByText("Bozza salvata con successo.")).toBeVisible();
    } finally {
      await deleteDraftArticle(autore.email, autore.password, id);
    }
  });
});
