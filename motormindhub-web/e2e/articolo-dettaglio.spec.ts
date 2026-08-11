import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
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

  /**
   * Regressione: useArticle allegava `skipAuth: true` alla GET su questo
   * endpoint partendo dalla premessa sbagliata che "pubblico" (permitAll,
   * nessuna autenticazione richiesta) significasse "il token va nascosto
   * se esiste" — apiFetch gestisce già correttamente l'assenza di token,
   * skipAuth ne sopprimeva invece uno VALIDO già in memoria. Effetto
   * concreto: getArticleById incrementa numeroVisualizzazioni solo per un
   * ruolo non redazionale (Guest/Iscritto) - un Autore che rileggeva un
   * proprio articolo pubblicato ne gonfiava artificialmente le letture,
   * indistinguibile lato backend da una visita reale. Verificato anche
   * l'header Authorization stesso (non solo l'effetto sul contatore): la
   * richiesta deve includerlo per un Autore autenticato, ometterlo per un
   * Guest davvero anonimo.
   */
  test("il contatore letture rispetta il ruolo: un Autore che rilegge non incrementa, un Guest sì", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo skipAuth ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria skipAuth ${stamp}`,
    });

    try {
      const authHeaders: (string | undefined)[] = [];
      page.on("request", (req) => {
        if (req.url().endsWith(`/api/v1/articoli/${id}`) && req.method() === "GET") {
          authHeaders.push(req.headers()["authorization"]);
        }
      });

      await loginViaUi(page, autore.email, autore.password);
      expect(await getViewCount(id)).toBe(0);

      for (let i = 0; i < 3; i++) {
        await page.goto(`/articoli/${id}`);
        await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      }
      await page.waitForTimeout(300);

      expect(authHeaders.length).toBeGreaterThan(0);
      for (const header of authHeaders) {
        expect(header).toMatch(/^Bearer /);
      }
      expect(await getViewCount(id)).toBe(0);

      // Guest: nuovo context, nessuna sessione/cookie ereditati.
      authHeaders.length = 0;
      const guestContext = await page.context().browser()!.newContext();
      const guestPage = await guestContext.newPage();
      guestPage.on("request", (req) => {
        if (req.url().endsWith(`/api/v1/articoli/${id}`) && req.method() === "GET") {
          authHeaders.push(req.headers()["authorization"]);
        }
      });

      try {
        for (let i = 0; i < 3; i++) {
          await guestPage.goto(`/articoli/${id}`);
          await expect(guestPage.getByRole("heading", { name: titolo })).toBeVisible();
        }
        await guestPage.waitForTimeout(300);

        expect(authHeaders.length).toBeGreaterThan(0);
        for (const header of authHeaders) {
          expect(header).toBeUndefined();
        }
        expect(await getViewCount(id)).toBe(3);
      } finally {
        await guestContext.close();
      }
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

  /**
   * Regressione: il corpo dell'articolo (i paragrafi) usava text-chrome
   * (#B8BEC7, DESIGN_SYSTEM.md: "bordi, icone, testo secondario chiaro")
   * invece di text-paper (#EDEEF0, "testo primario su sfondo scuro") —
   * stesso problema semantico già corretto in ArticleEditor.tsx per il
   * testo che l'autore scrive, qui sul lato lettura. chrome supera comunque
   * la soglia WCAG AA, ma è il colore sbagliato per il contenuto principale
   * che il lettore è lì per leggere. Titolo e nome autore erano già in
   * paper (invariati); breadcrumb e data/tempo di lettura restano in fog
   * di proposito (sono davvero metadata secondari) — verificato che il fix
   * non li abbia toccati.
   */
  test("il corpo dell'articolo è in paper (colore primario), non chrome/fog: leggibile quanto il titolo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo contrasto corpo ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria contrasto corpo ${stamp}`,
    });

    try {
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const colors = await page.evaluate(() => ({
        titolo: getComputedStyle(document.querySelector("h1")!).color,
        // data-testid, non una classe tipografica (leading-*/text-*) né il
        // markup interno di react-markdown: quelle sono soggette a tuning
        // (dimensione/interlinea/spacing) o a scelte di libreria, non vanno
        // usate come selettore o ogni ritocco romperebbe silenziosamente
        // questo test.
        corpo: getComputedStyle(document.querySelector('[data-testid="articolo-corpo"] p')!).color,
        // Metadata secondari (fog, invariati): il fix non deve averli toccati.
        // "nav" da solo prenderebbe il primo <nav> in ordine DOM, quello di
        // PublicHeader (Home/Esplora/Chi Siamo) — serve lo scope a <main>
        // per arrivare al breadcrumb di ArticleDetailContent.
        breadcrumb: getComputedStyle(document.querySelector("main nav")!).color,
      }));
      // #EDEEF0 = rgb(237, 238, 240) — non più #B8BEC7 (chrome, rgb(184, 190, 199)).
      expect(colors.corpo).toBe("rgb(237, 238, 240)");
      expect(colors.corpo).toBe(colors.titolo);
      // #888E95 (fog) = rgb(136, 142, 149) — resta secondario, non toccato dal fix.
      expect(colors.breadcrumb).toBe("rgb(136, 142, 149)");

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  /**
   * Regressione: il corpo articolo era text-sm/leading-relaxed/gap-4 —
   * compresso, poco arioso per una lettura lunga (ispirato al riferimento
   * Quattroruote fornito dall'utente). Con leading-loose (line-height 32px
   * a text-base) il gap-4 originale (16px, pensato per leading-relaxed)
   * rendeva lo stacco tra paragrafi visivamente debole rispetto al nuovo
   * interlinea più ampio — verificato con screenshot prima/dopo, risolto
   * passando a gap-6 (24px). Con react-markdown (motore Markdown, sostituisce
   * lo split manuale su doppio a-capo) i <p> sono generati dalla libreria,
   * non più separati da un flex gap ma nel flusso normale: lo stacco è ora
   * un margin-top su "p + p" ([&_p+p]:mt-6 sul wrapper) — stesso 24px,
   * verificato qui misurando la distanza tra due paragrafi reali invece del
   * CSS gap (che con markup generato da libreria non esiste più).
   */
  test("corpo articolo: text-base/leading-loose, spaziatura tra paragrafi non più compressa come un elemento UI secondario", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo tipografia corpo ${stamp}`;
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria tipografia corpo ${stamp}`,
      testo: "Primo paragrafo di prova.\n\nSecondo paragrafo di prova.",
    });

    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const paragraphs = document.querySelectorAll('[data-testid="articolo-corpo"] p');
        const [first, second] = [paragraphs[0], paragraphs[1]] as [HTMLElement, HTMLElement];
        const style = getComputedStyle(first);
        return {
          fontSize: style.fontSize,
          lineHeight: parseFloat(style.lineHeight),
          paragraphGap: second.getBoundingClientRect().top - first.getBoundingClientRect().bottom,
        };
      });
      expect(metrics.fontSize).toBe("16px"); // text-base, non più text-sm (14px)
      expect(metrics.lineHeight).toBeCloseTo(32, 0); // leading-loose (2 × 16px), non più leading-relaxed (1.625 × 14px ≈ 22.75px)
      expect(metrics.paragraphGap).toBeCloseTo(24, 0); // margin-top 24px (mt-6) tra paragrafi, non più i 16px di gap-4

      // Mobile: testo più grande + interlinea più ampio non deve causare
      // overflow orizzontale né sovrapposizioni — solo più scroll verticale,
      // atteso e accettabile.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);

      const axeMobile = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeMobile.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  /**
   * Editor Markdown (ArticleBodyEditor/TipTap) -> lib/articoli/markdown.ts
   * (docToMarkdown) -> Articolo.testo -> react-markdown qui in lettura: il
   * round-trip completo, non solo il rendering. Il Markdown iniettato qui
   * imita esattamente quello che docToMarkdown produrrebbe per H2/H3/
   * grassetto/corsivo/immagine (## , ### , **grassetto**, *corsivo*,
   * ![alt](src) su una riga a sé) — un test end-to-end che passasse anche
   * per un articolo digitato a mano nell'editor, verificato separatamente
   * dal vivo (non automatizzabile qui: l'upload reale dell'immagine
   * richiederebbe un file e l'endpoint /immagini-corpo).
   */
  test("Markdown: H2/H3/grassetto/corsivo/immagine si rendono correttamente, contrasto e alt text ok", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo markdown ${stamp}`;
    const testo = [
      "## Il sistema frenante",
      "Un paragrafo con **grassetto** e *corsivo* insieme.",
      "### Dettaglio tecnico",
      "![Schema del sistema ABS](https://res.cloudinary.com/demo/image/upload/sample.jpg)",
    ].join("\n\n");
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria markdown ${stamp}`,
      testo,
    });

    try {
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const corpo = page.getByTestId("articolo-corpo");
      await expect(corpo.getByRole("heading", { name: "Il sistema frenante", level: 2 })).toBeVisible();
      await expect(corpo.getByRole("heading", { name: "Dettaglio tecnico", level: 3 })).toBeVisible();
      await expect(corpo.locator("strong")).toHaveText("grassetto");
      await expect(corpo.locator("em")).toHaveText("corsivo");
      const immagine = corpo.getByRole("img", { name: "Schema del sistema ABS" });
      await expect(immagine).toBeVisible();
      await expect(immagine).toHaveAttribute("alt", "Schema del sistema ABS");

      // Regressione: h2/h3 erano troppo vicini in dimensione (20px/18px, un
      // solo gradino Tailwind) per leggersi come una gerarchia distinta —
      // non basta che i tag siano diversi nel DOM, devono esserlo anche
      // visivamente (computed font-size, non solo presenza del tag).
      const sizes = await page.evaluate(() => {
        const h2 = document.querySelector('[data-testid="articolo-corpo"] h2')!;
        const h3 = document.querySelector('[data-testid="articolo-corpo"] h3')!;
        return {
          h2: parseFloat(getComputedStyle(h2).fontSize),
          h3: parseFloat(getComputedStyle(h3).fontSize),
        };
      });
      expect(sizes.h2).toBeGreaterThan(sizes.h3);

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  /**
   * I due articoli di test storici (ABS, Problemi Frequenti ABS) e in
   * generale ogni Articolo.testo scritto prima di questa funzionalità sono
   * testo semplice, senza sintassi Markdown: devono continuare a rendersi
   * come un unico paragrafo leggibile, non riscritti né spezzati - nessuna
   * migrazione dati necessaria (RF confermato con l'utente prima del piano).
   */
  test("testo semplice preesistente (nessuna sintassi Markdown) resta un unico paragrafo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Articolo testo semplice ${stamp}`;
    const testo = "Questo è un testo semplice preesistente, senza alcuna sintassi Markdown al suo interno.";
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria testo semplice ${stamp}`,
      testo,
    });

    try {
      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const corpo = page.getByTestId("articolo-corpo");
      await expect(corpo.locator("p")).toHaveCount(1);
      await expect(corpo.locator("p")).toHaveText(testo);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
