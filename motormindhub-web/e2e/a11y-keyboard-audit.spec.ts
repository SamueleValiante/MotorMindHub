import { test } from "./fixtures";
import type { Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { loginViaUi } from "./helpers/ui";
import { deleteDraftArticle } from "./helpers/test-articles";

/**
 * Audit tastiera (sola verifica, nessuna correzione): non un occhio umano
 * che guarda lo schermo, ma la stessa domanda posta al browser reale via
 * getComputedStyle sull'elemento a fuoco dopo ogni Tab - più preciso di
 * "mi sembra visibile", perché legge outline/box-shadow effettivi dopo
 * cascata e stati :focus-visible, esattamente cio' che un browser reale
 * applicherebbe. Naviga con Tab/Shift+Tab/Invio/Esc, mai il mouse per
 * interagire (i click qui sotto servono solo a innescare stati - login,
 * apertura modali - per poter POI verificare la tastiera al loro interno).
 */

interface FocusStep {
  index: number;
  tag: string;
  role: string | null;
  accessibleName: string;
  hasVisibleFocusIndicator: boolean;
  outline: string;
  boxShadow: string;
}

interface KeyboardAuditResult {
  area: string;
  path: string;
  steps: FocusStep[];
  cycledBackToStart: boolean;
  note?: string;
}

interface ModalAuditResult {
  area: string;
  opened: boolean;
  focusMovedIntoModal: boolean;
  tabStaysInsideModal: boolean;
  escapeCloses: boolean;
  focusReturnsToTrigger: boolean | null;
  note: string;
}

const results: KeyboardAuditResult[] = [];
const modalResults: ModalAuditResult[] = [];

/**
 * L'accessible name calcolato solo da aria-label/textContent/placeholder
 * non basta a distinguere due <input> con la stessa label esterna (o
 * nessuna) - due campi diversi risulterebbero "uguali" e il rilevamento
 * del ciclo (tornati al primo elemento) scatterebbe troppo presto,
 * troncando l'audit. Un marker univoco assegnato al primo passaggio su
 * ogni elemento (data-attribute, non serializzabile altrimenti fra
 * page.evaluate) e' l'unico modo affidabile di sapere "e' lo stesso nodo
 * DOM di prima", indipendente dal suo nome accessibile.
 */
async function describeActiveElement(page: Page): Promise<(FocusStep & { domKey: string }) | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;

    const MARK = "data-a11y-audit-mark";
    if (!el.hasAttribute(MARK)) {
      const w = window as unknown as { __a11yAuditCounter?: number };
      w.__a11yAuditCounter = (w.__a11yAuditCounter ?? 0) + 1;
      el.setAttribute(MARK, String(w.__a11yAuditCounter));
    }

    const style = getComputedStyle(el);
    const outline = `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
    const boxShadow = style.boxShadow;
    const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const hasBoxShadowRing = boxShadow !== "none" && boxShadow.trim().length > 0;

    let labelText = "";
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      labelText = label?.textContent?.trim() ?? "";
    }
    const name =
      el.getAttribute("aria-label") ||
      labelText ||
      el.textContent?.trim() ||
      el.getAttribute("placeholder") ||
      el.getAttribute("name") ||
      el.getAttribute("type") ||
      "";

    return {
      index: 0,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role"),
      accessibleName: name.trim().slice(0, 60),
      hasVisibleFocusIndicator: hasOutline || hasBoxShadowRing,
      outline,
      boxShadow,
      domKey: el.getAttribute(MARK) as string,
    };
  });
}

async function tabThrough(page: Page, area: string, path: string, maxTabs = 60): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.waitForTimeout(500);

  const steps: FocusStep[] = [];
  let cycledBackToStart = false;
  let firstDomKey: string | null = null;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const step = await describeActiveElement(page);
    if (!step) continue;
    step.index = i;
    if (firstDomKey === null) {
      firstDomKey = step.domKey;
    } else if (step.domKey === firstDomKey) {
      cycledBackToStart = true;
      break;
    }
    steps.push(step);
  }

  results.push({ area, path, steps, cycledBackToStart });
}

test.describe.configure({ mode: "serial" });

test.describe("Audit tastiera (sola verifica)", () => {
  // Consenso pre-seminato: qui si verifica l'ordine di tab del contenuto di
  // pagina, non il banner in se' (gia' verificato leggendo il sorgente:
  // nessun role="dialog", nessun gestore di Escape, nessun focus trap -
  // cfr. report finale). Stesso pattern gia' usato nel resto della suite
  // e2e per lo stesso motivo (il banner intercetta altrimenti i click/tab).
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("Home, Login, Registrazione, Esplora", async ({ page }) => {
    test.setTimeout(120_000);
    await tabThrough(page, "Home", "/");
    await tabThrough(page, "Login", "/login");
    await tabThrough(page, "Registrazione", "/registrazione");
    await tabThrough(page, "Esplora Articoli", "/esplora");
  });

  test("Flusso Autore: creare un articolo, solo tastiera dall'inizio alla fine", async ({
    page,
    testUsers,
  }) => {
    test.setTimeout(120_000);
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    await loginViaUi(page, autore.email, autore.password);
    await tabThrough(page, "Autore — Nuovo Articolo", "/autore/articoli/nuovo");

    // Non solo raggiungibilita' dei singoli campi (gia' verificata sopra):
    // qui si tenta di completare davvero il flusso "crea bozza" usando solo
    // tastiera, come richiesto. Mai page.fill/click - solo keyboard.type e Tab.
    const stamp = Date.now();
    let flowNote = "";
    try {
      await page.goto("/autore/articoli/nuovo", { waitUntil: "domcontentloaded" });
      // Un debug mirato (fuori da questo file) ha mostrato che i primi Tab
      // dopo domcontentloaded possono cadere su <body> perche' la pagina
      // sta ancora caricando categorie/utente (async): contare i Tab alla
      // cieca e' fragile. Si aspetta invece un segnale di prontezza
      // semantico (il campo titolo visibile) e ci si posiziona li'
      // direttamente - la raggiungibilita' di TUTTI i campi via Tab,
      // sidebar inclusa, e' gia' verificata a parte dal passaggio
      // tabThrough sopra; qui si verifica l'OPERABILITA' via tastiera del
      // form stesso (digitare, scegliere una categoria, inviare).
      const titolo = page.getByLabel("Titolo dell'articolo");
      await titolo.waitFor({ state: "visible", timeout: 15_000 });
      await titolo.focus();
      await page.keyboard.type(`Articolo tastiera ${stamp}`);
      await page.keyboard.press("Tab"); // -> textarea testo
      await page.keyboard.type("Testo scritto solo da tastiera per l'audit.");
      await page.keyboard.press("Tab"); // -> select categoria
      // Un <select> nativo si opera con le frecce, non Invio/Tab per scegliere:
      // verifica che almeno una opzione diversa da quella vuota sia selezionabile.
      await page.keyboard.press("ArrowDown");
      const categoriaSelezionata = await page.evaluate(() => {
        const el = document.activeElement as HTMLSelectElement | null;
        return el?.tagName === "SELECT" ? el.value : null;
      });
      flowNote += `Dopo ArrowDown sul select categoria, valore=${categoriaSelezionata}. `;

      // Salta ai due bottoni finali (Tag "+ Aggiungi" e i bottoni di submit
      // stanno in mezzo): Tab ripetutamente cercando "Salva bozza".
      let foundSalvaBozza = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const step = await describeActiveElement(page);
        if (step?.accessibleName.includes("Salva bozza")) {
          foundSalvaBozza = true;
          break;
        }
      }
      flowNote += foundSalvaBozza
        ? "Bottone 'Salva bozza' raggiunto via Tab. "
        : "Bottone 'Salva bozza' NON raggiunto entro 10 Tab dal select categoria. ";

      if (foundSalvaBozza && categoriaSelezionata) {
        await page.keyboard.press("Enter");
        await page.waitForURL(/\/autore\/articoli\/\d+\/modifica$/, { timeout: 10_000 }).catch(() => {
          flowNote += "Invio su 'Salva bozza' non ha portato alla pagina di modifica entro 10s. ";
        });
        if (/\/autore\/articoli\/\d+\/modifica$/.test(page.url())) {
          flowNote += "Bozza creata con successo, solo tastiera, nessun mouse. ";
          const id = Number(page.url().match(/\/autore\/articoli\/(\d+)\/modifica$/)?.[1]);
          if (id) await deleteDraftArticle(autore.email, autore.password, id);
        }
      }
    } catch (error) {
      flowNote += `Eccezione durante il flusso: ${error instanceof Error ? error.message : String(error)}`;
    }

    results.push({
      area: "Autore — Nuovo Articolo (flusso completo da tastiera)",
      path: "/autore/articoli/nuovo",
      steps: [],
      cycledBackToStart: false,
      note: flowNote,
    });
  });

  test("Flusso Gestore: sospendere un account (modale SuspendAccountModal)", async ({
    page,
    testUsers,
  }) => {
    test.setTimeout(120_000);
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();

    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account");
    await page.locator("tr", { hasText: target.email }).getByRole("link").click();
    await page.waitForURL(/\/gestore\/gestione-account\/\d+/);

    // Trova il trigger via tastiera (Tab fino al bottone "Sospendi account"),
    // non un click diretto: verifica anche che il bottone sia raggiungibile
    // da tastiera, non solo che il modale si apra.
    let triggerFound = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const step = await describeActiveElement(page);
      if (step?.accessibleName.includes("Sospendi account")) {
        triggerFound = true;
        break;
      }
    }

    if (!triggerFound) {
      modalResults.push({
        area: "SuspendAccountModal",
        opened: false,
        focusMovedIntoModal: false,
        tabStaysInsideModal: false,
        escapeCloses: false,
        focusReturnsToTrigger: null,
        note: "Il bottone 'Sospendi account' non è stato raggiunto entro 30 pressioni di Tab dal caricamento pagina.",
      });
      return;
    }

    const beforeOpen = await describeActiveElement(page);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const afterOpen = await describeActiveElement(page);
    const focusMovedIntoModal = afterOpen !== null && JSON.stringify(afterOpen) !== JSON.stringify(beforeOpen);

    // Verifica focus-trap: Tab molte volte, controlla se l'elemento a fuoco
    // esce mai dal contenitore del modale (role=dialog).
    const trapCheck = await page.evaluate(async () => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { hasDialog: false, escaped: false };
      let escaped = false;
      for (let i = 0; i < 25; i++) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
        await new Promise((r) => setTimeout(r, 10));
        if (document.activeElement && !dialog.contains(document.activeElement)) {
          escaped = true;
          break;
        }
      }
      return { hasDialog: true, escaped };
    });

    // Il dispatchEvent sintetico sopra non simula la vera tabbing-order del
    // browser (quella e' nativa, non scriptabile) - serve solo a verificare
    // se ESISTE un gestore che intercetta Tab per intrappolare il focus.
    // La verifica affidabile e' quella reale sotto, con keyboard.press.
    let realEscaped = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog ? dialog.contains(document.activeElement) : true;
      });
      if (!inside) {
        realEscaped = true;
        break;
      }
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const dialogStillOpen = await page.locator('[role="dialog"]').count();
    const afterEscape = await describeActiveElement(page);

    modalResults.push({
      area: "SuspendAccountModal",
      opened: true,
      focusMovedIntoModal,
      tabStaysInsideModal: !realEscaped,
      escapeCloses: dialogStillOpen === 0,
      focusReturnsToTrigger:
        dialogStillOpen === 0 && afterEscape?.accessibleName.includes("Sospendi account")
          ? true
          : dialogStillOpen === 0
            ? false
            : null,
      note: `trapCheck synthetic(non affidabile)=${JSON.stringify(trapCheck)}; focus dopo Escape: ${afterEscape ? `${afterEscape.tag} "${afterEscape.accessibleName}"` : "nessuno/body"}`,
    });
  });

  test("scrivi report tastiera", async () => {
    const dir = "/tmp/claude-1000/-home-samuele-Desktop-MotorMindHub-motormindhub-web/93ceab03-e221-4297-af59-7b8478d58f88/scratchpad";
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/keyboard-audit.json`, JSON.stringify({ results, modalResults }, null, 2));
    console.log(`KEYBOARD_AUDIT_SUMMARY routes=${results.length} modals=${modalResults.length}`);
  });
});
