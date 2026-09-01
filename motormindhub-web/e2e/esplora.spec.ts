import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import {
  createPublishedArticle,
  createPublishedArticleInCategory,
  createCategory,
  createSubcategory,
  deleteArticle,
  viewArticle,
  getCategoryId,
  login,
} from "./helpers/test-articles";

test.describe("Esplora Articoli", () => {
  test("il filtro categoria invia un solo id esatto (nessuna espansione lato client)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaA = `Categoria A ${stamp}`;
    const categoriaB = `Categoria B ${stamp}`;
    const titoloA = `Articolo categoria A ${stamp}`;
    const titoloB = `Articolo categoria B ${stamp}`;

    const idA = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloA,
      categoriaNome: categoriaA,
    });
    const idB = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloB,
      categoriaNome: categoriaB,
    });

    const categoriaAId = await getCategoryId(categoriaA);

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      // categoriaA e' una categoria radice (createPublishedArticle non
      // specifica un padre): compare subito tra i bottoni di primo livello
      // del drill-down, senza dover navigare prima da nessuna parte.
      const [request] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes("/api/v1/articoli?") && req.url().includes("categoriaIds")
        ),
        page.getByRole("group", { name: "Sottocategorie" }).getByRole("button", { name: categoriaA }).click(),
      ]);

      // Un solo id nella query string, ed e' esattamente quello di "Categoria A"
      // assegnato dal backend: nessuna espansione/aggiunta di altri id lato client.
      const url = new URL(request.url());
      expect(url.searchParams.getAll("categoriaIds")).toEqual([String(categoriaAId)]);

      await expect(page.getByRole("heading", { name: titoloA })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloB })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idA);
      await deleteArticle(manager.email, manager.password, idB);
    }
  });

  test("ricerca testuale: solo l'articolo che corrisponde alla query", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Xyloflange${stamp}`;
    const titoloTarget = `Guida ${parolaUnica}`;
    const titoloAltro = `Articolo generico ${stamp}`;
    const categoria = `Categoria ricerca ${stamp}`;

    const idTarget = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget,
      categoriaNome: categoria,
    });
    const idAltro = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloAltro,
      categoriaNome: `${categoria} 2`,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await page.getByLabel("Ricerca testuale").fill(parolaUnica);
      await page.getByRole("button", { name: "Applica filtri" }).click();

      await expect(page.getByRole("heading", { name: titoloTarget })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloAltro })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idTarget);
      await deleteArticle(manager.email, manager.password, idAltro);
    }
  });

  test("ricerca live: digitazione veloce non produce un risultato fuori ordine", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Turbocompressore${stamp}`;
    const titoloTarget = `Guida ${parolaUnica}`;
    const titoloAltro = `Articolo generico ${stamp}`;
    const categoria = `Categoria ricerca live ${stamp}`;

    const idTarget = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget,
      categoriaNome: categoria,
    });
    const idAltro = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloAltro,
      categoriaNome: `${categoria} 2`,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      // pressSequentially con un piccolo ritardo per carattere: abbastanza
      // "veloce" da non lasciare mai una pausa di 350ms (il debounce) tra un
      // tasto e il successivo, ma la digitazione dell'intera parola dura
      // comunque piu' del debounce stesso, quindi il timer riparte piu'
      // volte durante la digitazione - esattamente lo scenario a rischio di
      // risposta fuori ordine (piu' fetch in volo, l'ultima non necessariamente
      // l'ultima a rispondere) che l'AbortController in useArticleSearch deve
      // gestire. Nessun click su "Cerca": la ricerca deve arrivare da sola.
      await page.getByLabel("Ricerca testuale").pressSequentially(parolaUnica, { delay: 40 });

      await expect(page.getByRole("heading", { name: titoloTarget })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloAltro })).not.toBeVisible();
      // Il conteggio deve riflettere esattamente la query finale (1 solo
      // match), non una risposta intermedia (es. per un prefisso della
      // parola) arrivata per ultima per puro caso di rete.
      await expect(page.getByText("1 risultati")).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idTarget);
      await deleteArticle(manager.email, manager.password, idAltro);
    }
  });

  test("ricerca live: il bottone \"Cerca\" forza subito la query digitata, ignorando il debounce residuo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Radiatore${stamp}`;
    const titoloTarget = `Guida ${parolaUnica}`;

    const idTarget = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget,
      categoriaNome: `Categoria bottone ricerca ${stamp}`,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      // Digita e clicca "Cerca" subito dopo, ben prima che il debounce
      // (350ms) da solo avrebbe applicato la query: la richiesta e il
      // risultato devono comunque comparire senza attesa percepibile.
      const [request] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes("/api/v1/articoli?") && req.url().includes("query=")
        ),
        (async () => {
          await page.getByLabel("Ricerca testuale").fill(parolaUnica);
          await page.getByRole("button", { name: "Applica filtri" }).click();
        })(),
      ]);
      const url = new URL(request.url());
      expect(url.searchParams.get("query")).toBe(parolaUnica);

      await expect(page.getByRole("heading", { name: titoloTarget })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idTarget);
    }
  });

  test("audit accessibilità (axe) della ricerca live, live region inclusa", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Alternatore${stamp}`;
    const titolo = `Guida ${parolaUnica}`;

    const idArticolo = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria a11y ricerca ${stamp}`,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await page.getByLabel("Ricerca testuale").fill(parolaUnica);
      // Attende che la ricerca live (debounced, nessun click su "Cerca")
      // sia effettivamente scattata: la scansione deve trovare la live
      // region gia' aggiornata al conteggio finale, non a quello iniziale.
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, idArticolo);
    }
  });

  test("ordinamento 'Più lette': l'articolo con più visualizzazioni compare per primo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoria = `Categoria ordinamento ${stamp}`;
    const titoloPocoLetto = `Poco letto ${stamp}`;
    const titoloMoltoLetto = `Molto letto ${stamp}`;

    const idPocoLetto = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloPocoLetto,
      categoriaNome: categoria,
    });
    const idMoltoLetto = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloMoltoLetto,
      categoriaNome: `${categoria} 2`,
    });
    await viewArticle(idMoltoLetto, 5);

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();
      await page.getByLabel("Ricerca testuale").fill(String(stamp));
      await page.getByRole("button", { name: "Applica filtri" }).click();
      await page.getByRole("button", { name: "Più lette" }).click();

      const titoli = page.getByRole("heading", { level: 3 });
      await expect(titoli.first()).toHaveText(titoloMoltoLetto);
    } finally {
      await deleteArticle(manager.email, manager.password, idPocoLetto);
      await deleteArticle(manager.email, manager.password, idMoltoLetto);
    }
  });

  test("paginazione: più di una pagina di risultati, la pagina 2 mostra altri articoli", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoria = `Categoria paginazione ${stamp}`;
    const ids: number[] = [];

    // Un login riusato per tutte le creazioni/cancellazioni: 7 create + 7
    // delete con un login ciascuna esaurirebbero LoginRateLimiter (10/min
    // per account) sullo stesso manager, cfr. autore-dashboard.spec.ts.
    const managerToken = await login(manager.email, manager.password);

    for (let i = 0; i < 7; i++) {
      const id = await createPublishedArticle(
        manager.email,
        manager.password,
        {
          titolo: `Articolo paginato ${stamp} #${i}`,
          categoriaNome: i === 0 ? categoria : `${categoria} ${i}`,
        },
        managerToken
      );
      ids.push(id);
    }

    try {
      await page.goto(`/esplora?query=${stamp}`);
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await expect(page.getByText("7 risultati")).toBeVisible();
      await expect(page.getByRole("button", { name: "2", exact: true })).toBeVisible();

      const primoTitoloPagina1 = await page.getByRole("heading", { level: 3 }).first().textContent();

      await page.getByRole("button", { name: "2", exact: true }).click();
      await expect(page).toHaveURL(/pagina=1/);

      // Attesa con retry (non una lettura una tantum subito dopo il click):
      // la fetch della pagina 2 e' asincrona, un textContent() immediato
      // rischia di leggere ancora il risultato della pagina 1.
      await expect(page.getByRole("heading", { level: 3 }).first()).not.toHaveText(
        primoTitoloPagina1 ?? ""
      );
    } finally {
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id, managerToken);
      }
    }
  });

  test("cambiare filtro mentre si è su una pagina >0 resetta a pagina 0", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaTarget = `Categoria reset ${stamp}`;
    const ids: number[] = [];

    // Cfr. commento nel test "paginazione" sopra: stesso motivo, stesso fix.
    const managerToken = await login(manager.email, manager.password);

    // 6 articoli "filler" (stessa query, categorie diverse): riempiono la pagina 1.
    for (let i = 0; i < 6; i++) {
      const id = await createPublishedArticle(
        manager.email,
        manager.password,
        {
          titolo: `Filler reset ${stamp} #${i}`,
          categoriaNome: `Categoria reset filler ${stamp} ${i}`,
        },
        managerToken
      );
      ids.push(id);
    }
    // 2 articoli target, stessa categoria tra loro: nel risultato NON filtrato
    // finiscono in pagina 2 (7°/8° su dimensionePagina=6); nel risultato
    // filtrato per categoriaTarget sono gli UNICI 2 risultati, quindi
    // esistono solo in pagina 1 di quel risultato filtrato.
    const titoloTarget1 = `Target reset ${stamp} A`;
    const titoloTarget2 = `Target reset ${stamp} B`;
    const idTarget1 = await createPublishedArticle(
      manager.email,
      manager.password,
      { titolo: titoloTarget1, categoriaNome: categoriaTarget },
      managerToken
    );
    ids.push(idTarget1);
    const idTarget2 = await createPublishedArticle(
      manager.email,
      manager.password,
      { titolo: titoloTarget2, categoriaNome: categoriaTarget },
      managerToken
    );
    ids.push(idTarget2);

    try {
      await page.goto(`/esplora?query=${stamp}`);
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();
      await expect(page.getByText("8 risultati")).toBeVisible();

      await page.getByRole("button", { name: "2", exact: true }).click();
      await expect(page).toHaveURL(/pagina=1/);

      // Un solo click sul drill-down basta: handleCategoryNavigate resetta
      // "pagina" da solo, non serve un secondo "Applica filtri" come quando
      // la categoria era parte dello stesso form della query testuale.
      await page.getByRole("group", { name: "Sottocategorie" }).getByRole("button", { name: categoriaTarget }).click();

      // Se il reset non scattasse, la fetch richiederebbe la pagina 2 di un
      // risultato filtrato che ne ha solo 1 (2 elementi < dimensionePagina):
      // Spring restituirebbe una pagina vuota e l'utente vedrebbe "Nessun
      // risultato" nonostante i 2 articoli esistano davvero.
      await expect(page).not.toHaveURL(/pagina=1/);
      await expect(page.getByRole("heading", { name: titoloTarget1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloTarget2 })).toBeVisible();
    } finally {
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id, managerToken);
      }
    }
  });

  test("categoria + ricerca testuale insieme: vera intersezione, non solo l'ultimo filtro applicato", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaComune = `Categoria combinata ${stamp}`;
    const categoriaAltra = `Categoria combinata altra ${stamp}`;
    const parolaChiave = `Interfrenocombinato${stamp}`;

    const titoloMatch = `${parolaChiave} guida completa`;
    const titoloSoloCategoria = `Altro articolo stessa categoria ${stamp}`;
    const titoloSoloQuery = `${parolaChiave} in altra categoria`;

    // Combacia con entrambi i filtri.
    const idMatch = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloMatch,
      categoriaNome: categoriaComune,
    });
    // Stessa categoria del match, ma la parola chiave non compare nel titolo/testo.
    const idSoloCategoria = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloSoloCategoria,
      categoriaNome: categoriaComune,
    });
    // Contiene la parola chiave, ma e' in un'altra categoria.
    const idSoloQuery = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloSoloQuery,
      categoriaNome: categoriaAltra,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      // La categoria naviga subito al click (drill-down); la query testuale
      // resta un campo "bozza" applicato solo al submit. Ordine: prima la
      // categoria (gia' in URL dopo il click), poi query + submit, che deve
      // patchare solo "query" lasciando categoriaIds intatto — e' esattamente
      // il comportamento che questo test verifica (vera intersezione, non
      // l'ultimo filtro che sovrascrive l'altro).
      await page.getByRole("group", { name: "Sottocategorie" }).getByRole("button", { name: categoriaComune }).click();
      await page.getByLabel("Ricerca testuale").fill(parolaChiave);
      await page.getByRole("button", { name: "Applica filtri" }).click();

      await expect(page.getByRole("heading", { name: titoloMatch })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloSoloCategoria })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: titoloSoloQuery })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idMatch);
      await deleteArticle(manager.email, manager.password, idSoloCategoria);
      await deleteArticle(manager.email, manager.password, idSoloQuery);
    }
  });

  test("stato vuoto: nessun risultato mostra EmptyState, non una schermata bianca", async ({ page }) => {
    await page.goto("/esplora?query=nessuna-corrispondenza-possibile-xyz");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    await expect(page.getByRole("heading", { name: "Nessun risultato" })).toBeVisible();
  });

  test("responsive: il pannello filtri e i risultati restano usabili su viewport mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/esplora");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    await expect(page.getByRole("heading", { name: "Esplora articoli" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Categoria" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Applica filtri" })).toBeVisible();
  });

  test("drill-down: mostra solo gli articoli attaccati esattamente al nodo selezionato (nessuna aggregazione), breadcrumb risale i livelli", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    // 5 livelli reali (Casa -> Modello -> Generazione -> Sistema ->
    // Sotto-sistema), la stessa profondita' della tassonomia migrata in
    // produzione (Fiat > Panda > Panda III > Meccanica > Freni) - un
    // fixture a 2 livelli non eserciterebbe il caso che ha reso necessario
    // il drill-down al posto del vecchio <select> piatto.
    const casaId = await createCategory(manager.email, manager.password, `Casa ${stamp}`);
    const modelloId = await createSubcategory(manager.email, manager.password, `Modello ${stamp}`, casaId);
    const generazioneId = await createSubcategory(
      manager.email,
      manager.password,
      `Generazione ${stamp}`,
      modelloId
    );
    const sistemaId = await createSubcategory(manager.email, manager.password, `Sistema ${stamp}`, generazioneId);
    const sottosistemaId = await createSubcategory(
      manager.email,
      manager.password,
      `Sottosistema ${stamp}`,
      sistemaId
    );

    const titoloFoglia = `Articolo foglia ${stamp}`;
    const idFoglia = await createPublishedArticleInCategory(manager.email, manager.password, {
      titolo: titoloFoglia,
      categoriaId: sottosistemaId,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      const sottocategorie = page.getByRole("group", { name: "Sottocategorie" });

      // Livello radice: la Casa e' tra i bottoni di primo livello.
      await expect(sottocategorie.getByRole("button", { name: `Casa ${stamp}` })).toBeVisible();
      await sottocategorie.getByRole("button", { name: `Casa ${stamp}` }).click();

      // "Casa" e' organizzativa (ha figlie, zero articoli propri): messaggio
      // dedicato, non il generico "Nessun risultato" da ricerca fallita.
      await expect(page.getByRole("heading", { name: "Categoria organizzativa" })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloFoglia })).not.toBeVisible();

      // Sceso di un livello: si vede il Modello, non piu' la Casa tra i figli.
      await expect(sottocategorie.getByRole("button", { name: `Modello ${stamp}` })).toBeVisible();
      await sottocategorie.getByRole("button", { name: `Modello ${stamp}` }).click();
      await sottocategorie.getByRole("button", { name: `Generazione ${stamp}` }).click();
      await sottocategorie.getByRole("button", { name: `Sistema ${stamp}` }).click();

      // Un livello prima della foglia vera: "Sistema" e' ancora puramente
      // organizzativo (la foglia vera e' "Sottosistema" sotto di lui) -
      // l'articolo NON deve comparire qui: e' l'esatto comportamento che
      // distingue il drill-down (match esatto) dalla ricerca generale
      // aggregata (RF1.2/TC11.2, verificata separatamente sotto).
      await expect(page.getByRole("heading", { name: titoloFoglia })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Categoria organizzativa" })).toBeVisible();

      await sottocategorie.getByRole("button", { name: `Sottosistema ${stamp}` }).click();
      // Foglia vera: nessuna sotto-categoria, solo il messaggio dedicato, e
      // ORA l'articolo compare (attaccato esattamente a questo nodo).
      await expect(page.getByText(`Nessuna sotto-categoria`)).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloFoglia })).toBeVisible();

      // Breadcrumb: tutti e 5 gli antenati cliccabili, l'ultimo e' quello corrente.
      const breadcrumb = page.getByRole("navigation", { name: "Percorso categoria" });
      for (const nome of [
        `Casa ${stamp}`,
        `Modello ${stamp}`,
        `Generazione ${stamp}`,
        `Sistema ${stamp}`,
        `Sottosistema ${stamp}`,
      ]) {
        // exact: true - "Sistema" e' altrimenti un match parziale valido
        // dentro il nome accessibile di "Sottosistema" (stesso prefisso),
        // violazione di strict mode altrimenti (2 bottoni, non 1).
        await expect(breadcrumb.getByRole("button", { name: nome, exact: true })).toBeVisible();
      }
      await expect(breadcrumb.getByRole("button", { name: `Sottosistema ${stamp}` })).toHaveAttribute(
        "aria-current",
        "location"
      );

      // Risalita dal breadcrumb: torna a "Generazione". I figli mostrati sono
      // di nuovo quelli di "Generazione" (Sistema, non Sottosistema) e
      // l'articolo sparisce di nuovo - "Generazione" e' organizzativo tanto
      // quanto "Sistema" e "Casa", il breadcrumb non fa eccezione al match
      // esatto (stesso onNavigate dei click sui figli).
      await breadcrumb.getByRole("button", { name: `Generazione ${stamp}` }).click();
      await expect(sottocategorie.getByRole("button", { name: `Sistema ${stamp}` })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloFoglia })).not.toBeVisible();

      // "Tutte le categorie" riporta alla radice.
      await breadcrumb.getByRole("button", { name: "Tutte le categorie" }).click();
      await expect(sottocategorie.getByRole("button", { name: `Casa ${stamp}` })).toBeVisible();
      await expect(page).not.toHaveURL(/categoriaIds/);
    } finally {
      await deleteArticle(manager.email, manager.password, idFoglia);
    }
  });

  test("arrivo diretto su un categoriaIds (es. link da Home, nessun click sull'albero) mantiene l'aggregazione RF1.2/TC11.2", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    // Marchio -> Modello, l'articolo attaccato al Modello (foglia): un link
    // Home->categoria porta sempre a una categoria radice (es. "Fiat"), che
    // e' per design puramente organizzativa - deve continuare ad aggregare,
    // altrimenti ogni link categoria di Home diventerebbe un vicolo cieco a
    // zero risultati (regressione reale, non solo di TC11.2).
    const marchioId = await createCategory(manager.email, manager.password, `Marchio esterno ${stamp}`);
    const modelloId = await createSubcategory(
      manager.email,
      manager.password,
      `Modello esterno ${stamp}`,
      marchioId
    );
    const titolo = `Articolo aggregato esterno ${stamp}`;
    const idArticolo = await createPublishedArticleInCategory(manager.email, manager.password, {
      titolo,
      categoriaId: modelloId,
    });

    try {
      // page.goto diretto sull'URL, non un click su CategoryDrilldownNav:
      // categoryNavAttiva resta false, espandiSottocategorie non viene
      // inviato, il backend applica il suo default (true).
      await page.goto(`/esplora?categoriaIds=${marchioId}`);
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Categoria organizzativa" })).not.toBeVisible();

      // Il primo click sull'albero DOPO l'atterraggio attiva il match
      // esatto anche per questa stessa categoria gia' in URL: la stessa
      // radice, una volta "toccata" dal drill-down, smette di aggregare.
      const breadcrumb = page.getByRole("navigation", { name: "Percorso categoria" });
      await breadcrumb.getByRole("button", { name: `Marchio esterno ${stamp}` }).click();
      await expect(page.getByRole("heading", { name: titolo })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Categoria organizzativa" })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idArticolo);
    }
  });

  test("il tasto Indietro del browser risale di un livello nel drill-down", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const casaId = await createCategory(manager.email, manager.password, `Casa indietro ${stamp}`);
    const modelloId = await createSubcategory(
      manager.email,
      manager.password,
      `Modello indietro ${stamp}`,
      casaId
    );

    await page.goto("/esplora");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    const sottocategorie = page.getByRole("group", { name: "Sottocategorie" });
    await sottocategorie.getByRole("button", { name: `Casa indietro ${stamp}` }).click();
    await expect(page).toHaveURL(new RegExp(`categoriaIds=${casaId}$`));

    await sottocategorie.getByRole("button", { name: `Modello indietro ${stamp}` }).click();
    await expect(page).toHaveURL(new RegExp(`categoriaIds=${modelloId}$`));

    // updateParams usa router.push (nuova voce nella cronologia a ogni
    // navigazione, mai router.replace): il tasto Indietro del browser deve
    // quindi risalire esattamente di un livello, non saltare la history.
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`categoriaIds=${casaId}$`));
    await expect(sottocategorie.getByRole("button", { name: `Modello indietro ${stamp}` })).toBeVisible();

    await page.goBack();
    await expect(page).not.toHaveURL(/categoriaIds/);
  });

  test("responsive: breadcrumb a piena profondita' resta usabile su viewport stretto", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const casaId = await createCategory(manager.email, manager.password, `Casa mobile ${stamp}`);
    const modelloId = await createSubcategory(manager.email, manager.password, `Modello mobile ${stamp}`, casaId);
    const generazioneId = await createSubcategory(
      manager.email,
      manager.password,
      `Generazione mobile con nome piuttosto lungo ${stamp}`,
      modelloId
    );
    const sistemaId = await createSubcategory(
      manager.email,
      manager.password,
      `Sistema mobile ${stamp}`,
      generazioneId
    );

    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`/esplora?categoriaIds=${sistemaId}`);
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    const breadcrumb = page.getByRole("navigation", { name: "Percorso categoria" });
    await expect(breadcrumb.getByRole("button", { name: `Sistema mobile ${stamp}` })).toBeVisible();

    // Nessuno scroll orizzontale della pagina: il breadcrumb va a capo
    // (flex-wrap) invece di sfondare la larghezza del viewport - la verifica
    // che conta e' sul documento intero, non solo sul contenitore del
    // breadcrumb, perche' e' cosi' che si manifesterebbe un vero problema
    // di layout (una barra di scroll orizzontale sull'intera pagina).
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Ogni segmento del breadcrumb resta un bersaglio distinto e cliccabile
    // (non compresso/sovrapposto): risalire funziona anche su questo viewport.
    await breadcrumb.getByRole("button", { name: `Casa mobile ${stamp}` }).click();
    await expect(page).toHaveURL(new RegExp(`categoriaIds=${casaId}$`));
  });

  test("audit accessibilità (axe) e tastiera sul drill-down dopo un livello di navigazione", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const casaId = await createCategory(manager.email, manager.password, `Casa a11y ${stamp}`);
    await createSubcategory(manager.email, manager.password, `Figlia A a11y ${stamp}`, casaId);
    await createSubcategory(manager.email, manager.password, `Figlia B a11y ${stamp}`, casaId);

    await page.goto(`/esplora?categoriaIds=${casaId}`);
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    const sottocategorie = page.getByRole("group", { name: "Sottocategorie" });
    await expect(sottocategorie.getByRole("button", { name: `Figlia A a11y ${stamp}` })).toBeVisible();

    // Scansione axe con almeno un livello di drill-down attivo (non solo la
    // vista radice): il breadcrumb con piu' di un segmento e la griglia
    // figli sono entrambi presenti solo cosi'.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[aria-label="Percorso categoria"], [aria-label="Sottocategorie"]')
      .analyze();
    expect(results.violations).toEqual([]);

    // Tastiera: Tab dal primo al secondo bottone figlio deve spostare il
    // focus (non restare bloccato/saltare l'elemento), ed e' un vero <button>
    // per ciascuno - non un <div> con onClick, che il rilevamento del focus
    // qui sotto non intercetterebbe.
    await sottocategorie.getByRole("button", { name: `Figlia A a11y ${stamp}` }).focus();
    await expect(sottocategorie.getByRole("button", { name: `Figlia A a11y ${stamp}` })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(sottocategorie.getByRole("button", { name: `Figlia B a11y ${stamp}` })).toBeFocused();

    // Attivazione da tastiera (Invio), non un click del mouse: deve navigare
    // esattamente come il click.
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/categoriaIds=/);

    // aria-current sul breadcrumb: solo l'ultimo segmento (quello corrente),
    // mai quelli intermedi/cliccabili per risalire.
    const breadcrumb = page.getByRole("navigation", { name: "Percorso categoria" });
    await expect(breadcrumb.getByRole("button", { name: `Casa a11y ${stamp}` })).not.toHaveAttribute(
      "aria-current",
      "location"
    );
  });
});
