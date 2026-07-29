import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import {
  createPublishedArticle,
  deleteArticle,
  getViewCount,
  getCategoryId,
  getSavedListTypes,
  removeSavedArticle,
} from "./helpers/test-articles";

test.describe("Dettaglio Articolo", () => {
  test("una visita incrementa numeroVisualizzazioni di esattamente 1, non 2 (strict-mode)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo contatore ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria contatore ${stamp}`,
    });

    try {
      expect(await getViewCount(id)).toBe(0);

      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      // Attesa esplicita oltre al render: se lo strict-mode innescasse una
      // seconda fetch dopo la prima, avverrebbe comunque entro pochi ms.
      await page.waitForTimeout(500);
      expect(await getViewCount(id)).toBe(1);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  /**
   * Regressione: bug reale trovato durante la verifica dell'Editor (punto
   * 8), gemello di quello corretto in useEditableArticle. useArticle usa la
   * stessa guardia "id già richiesto" (requestedIdRef) del test sopra per
   * evitare la doppia fetch dello strict-mode — ma la cancellazione era
   * legata a un flag `cancelled` locale all'effetto, impostato a true dalla
   * cleanup sincrona del replay mount -> cleanup -> mount: la guardia
   * impediva al remount di avviare una seconda fetch, quindi l'UNICA fetch
   * rimasta in volo veniva sempre scartata al suo arrivo, bloccando la
   * pagina su "Caricamento…" per sempre. Il test sopra (con page.goto
   * diretto) non lo intercetta: un hard navigation/hydration iniziale non
   * riproduce il bug, serve una navigazione client-side (un <Link>
   * dell'App Router già montato) come qui sotto. Corretto verificando la
   * validità della risposta contro requestedIdRef.current invece che
   * contro il flag locale.
   */
  test("navigazione client-side (click da Esplora) non resta bloccata su Caricamento (strict-mode)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo click esplora ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria click esplora ${stamp}`,
    });

    try {
      await page.goto("/esplora", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Ricerca testuale").fill(titolo);
      await page.getByRole("button", { name: "Applica filtri" }).click();
      await page.getByRole("heading", { name: titolo }).click();

      await page.waitForURL(`**/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByText("Caricamento…")).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("nessuna icona di segnalazione contenuto: solo il salvataggio", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo flag ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria flag ${stamp}`,
    });

    try {
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      await expect(page.getByRole("button", { name: "Salva articolo" })).toBeVisible();
      await expect(page.getByRole("button", { name: /segnala/i })).toHaveCount(0);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("utente non autenticato: il salvataggio rimanda al login", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo salvataggio anonimo ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria salvataggio anonimo ${stamp}`,
    });

    try {
      await page.goto(`/articoli/${id}`);
      await page.getByRole("button", { name: "Salva articolo" }).click();
      await expect(page).toHaveURL(/\/login\?redirectTo=/);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("utente autenticato: aggiunge e rimuove dai Preferiti, verificato via API", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Articolo preferiti ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria preferiti ${stamp}`,
    });

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      await page.getByRole("button", { name: "Salva articolo" }).click();
      await expect(page.getByRole("button", { name: "Aggiungi ai Preferiti" })).toBeVisible();
      await page.getByRole("button", { name: "Aggiungi ai Preferiti" }).click();
      await expect(page.getByText("Articolo salvato.")).toBeVisible();

      // Riapre il menu: la voce e' ora un toggle di rimozione, non di nuovo "Aggiungi".
      await page.getByRole("button", { name: "Salva articolo" }).click();
      await expect(page.getByRole("button", { name: "Rimuovi dai Preferiti" })).toBeVisible();
      await page.getByRole("button", { name: "Rimuovi dai Preferiti" }).click();
      await expect(page.getByText("Rimosso dai salvataggi.")).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("doppio click sul salva/rimuovi non invia due richieste", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Articolo doppio click ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria doppio click ${stamp}`,
    });

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto(`/articoli/${id}`);
      await page.getByRole("button", { name: "Salva articolo" }).click();

      let postCount = 0;
      page.on("request", (req) => {
        if (req.method() === "POST" && req.url().includes(`/articoli/${id}/salvataggi`)) {
          postCount++;
        }
      });

      const addButton = page.getByRole("button", { name: "Aggiungi ai Preferiti" });
      // dblclick genera due eventi click ravvicinati sullo stesso bottone:
      // se il pulsante non si disabilitasse durante la richiesta in corso,
      // partirebbero due POST invece di uno.
      await addButton.dblclick({ force: true });
      await expect(page.getByText("Articolo salvato.")).toBeVisible();
      await page.waitForTimeout(300);

      expect(postCount).toBe(1);
      expect(await getSavedListTypes(reader.email, reader.password, id)).toEqual(["PREFERITI"]);
    } finally {
      // deleteArticle va in 500 se l'articolo ha ancora un salvataggio
      // attivo (bug reale, vedi commento su removeSavedArticle): lo si
      // rimuove prima, qui, solo per igiene del DB di sviluppo.
      await removeSavedArticle(reader.email, reader.password, id, "PREFERITI");
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("Preferiti e Leggi più tardi sono toggle indipendenti: un articolo può stare in entrambe le liste", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Articolo doppia lista ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria doppia lista ${stamp}`,
    });

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto(`/articoli/${id}`);

      await page.getByRole("button", { name: "Salva articolo" }).click();
      await page.getByRole("button", { name: "Aggiungi ai Preferiti" }).click();
      await expect(page.getByText("Articolo salvato.")).toBeVisible();

      // Aggiungere a Leggi più tardi non deve rimuovere/toccare Preferiti:
      // riapre il menu, l'altra voce deve essere ancora "Aggiungi" (non
      // gia' spuntata per errore) prima del click.
      await page.getByRole("button", { name: "Salva articolo" }).click();
      await expect(page.getByRole("button", { name: "Rimuovi dai Preferiti" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Aggiungi a Leggi più tardi" })).toBeVisible();
      await page.getByRole("button", { name: "Aggiungi a Leggi più tardi" }).click();
      await expect(page.getByText("Articolo salvato.").last()).toBeVisible();

      // Entrambe risultano salvate, sia nella UI sia via API (getSavedArticles).
      await page.getByRole("button", { name: "Salva articolo" }).click();
      await expect(page.getByRole("button", { name: "Rimuovi dai Preferiti" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Rimuovi da Leggi più tardi" })).toBeVisible();

      const tipiSalvati = await getSavedListTypes(reader.email, reader.password, id);
      expect(tipiSalvati.sort()).toEqual(["LEGGI_PIU_TARDI", "PREFERITI"]);
    } finally {
      await removeSavedArticle(reader.email, reader.password, id, "PREFERITI");
      await removeSavedArticle(reader.email, reader.password, id, "LEGGI_PIU_TARDI");
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("'Altri articoli in {categoria}': solo la stessa categoria, mai l'articolo corrente", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaComune = `Categoria correlati ${stamp}`;
    const titoloCorrente = `Articolo corrente ${stamp}`;
    const titoloStessaCategoria = `Altro stessa categoria ${stamp}`;
    const titoloAltraCategoria = `Altro categoria diversa ${stamp}`;

    const idCorrente = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloCorrente,
      categoriaNome: categoriaComune,
    });
    const idStessaCategoria = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloStessaCategoria,
      categoriaNome: categoriaComune,
    });
    const idAltraCategoria = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloAltraCategoria,
      categoriaNome: `${categoriaComune} altra`,
    });

    try {
      await page.goto(`/articoli/${idCorrente}`);
      await expect(page.getByRole("heading", { name: titoloCorrente })).toBeVisible();

      const sezioneCorrelati = page.getByRole("heading", { name: `Altri articoli in ${categoriaComune}` });
      await expect(sezioneCorrelati).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloStessaCategoria })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloAltraCategoria })).not.toBeVisible();
      // L'articolo corrente non ricompare come "correlato" a se stesso.
      await expect(page.getByRole("heading", { name: titoloCorrente })).toHaveCount(1);
    } finally {
      await deleteArticle(manager.email, manager.password, idCorrente);
      await deleteArticle(manager.email, manager.password, idStessaCategoria);
      await deleteArticle(manager.email, manager.password, idAltraCategoria);
    }
  });

  test("articolo inesistente: messaggio dedicato, non una schermata bianca", async ({ page }) => {
    await page.goto("/articoli/999999999");
    await expect(page.getByRole("heading", { name: "Articolo non trovato" })).toBeVisible();
  });

  test("il breadcrumb collega alla categoria reale su Esplora", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoria = `Categoria breadcrumb ${stamp}`;
    const titolo = `Articolo breadcrumb ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: categoria,
    });
    const categoriaId = await getCategoryId(categoria);

    try {
      await page.goto(`/articoli/${id}`);
      const link = page.getByRole("navigation").getByRole("link", { name: categoria });
      await expect(link).toHaveAttribute("href", `/esplora?categoriaIds=${categoriaId}`);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("responsive: contenuto e azioni restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo mobile ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria mobile ${stamp}`,
    });

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByRole("button", { name: "Salva articolo" })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
