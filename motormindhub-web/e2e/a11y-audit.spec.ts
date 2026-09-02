import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { loginViaUi } from "./helpers/ui";
import {
  createPublishedArticle,
  createDraftArticle,
  createPendingArticle,
  deleteDraftArticle,
  deleteArticle,
} from "./helpers/test-articles";
import { getUserId } from "./helpers/test-users";
import { requestAccountDeletion, reportUser } from "./helpers/test-amministrazione-utenti";

/**
 * Audit di sola lettura (nessuna correzione qui): scansiona ogni route
 * costruita con axe-core, target WCAG 2.1 A+AA (stesso standard promesso
 * dalla pagina Dichiarazione di Accessibilità, mockup 13). I risultati si
 * accumulano in `report` (scope di modulo, i test in questo file girano
 * seriali nello stesso worker) e vengono scritti su disco dall'ultimo test.
 */

interface RouteResult {
  area: string;
  path: string;
  violations: Array<{
    id: string;
    impact: string | null | undefined;
    description: string;
    help: string;
    helpUrl: string;
    tags: string[];
    nodes: Array<{ target: string[]; html: string; failureSummary?: string }>;
  }>;
}

const report: RouteResult[] = [];

async function auditRoute(page: Page, area: string, path: string): Promise<void> {
  console.log(`AXE_ROUTE_START ${area} ${path}`);
  try {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20_000 });
    // Un breve assestamento invece di networkidle: pagine con polling/timer
    // in background (toast, refresh silenzioso del token) possono non
    // raggiungere mai networkidle e bloccare l'intero audit per una sola
    // route - non vale il rischio per un audit di sola lettura.
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    report.push({
      area,
      path,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.map((n) => ({
          target: n.target as string[],
          html: n.html,
          failureSummary: n.failureSummary,
        })),
      })),
    });
    console.log(`AXE_ROUTE_DONE ${area} violations=${results.violations.length}`);
  } catch (error) {
    // Una route che non carica/non risponde e' di per se' un finding
    // dell'audit (nessuna correzione qui, solo report), non deve pero'
    // far perdere il resto delle route in coda.
    report.push({
      area,
      path,
      violations: [
        {
          id: "audit-route-error",
          impact: "critical",
          description: `Impossibile completare la scansione: ${error instanceof Error ? error.message : String(error)}`,
          help: "La route non ha caricato/risposto entro il timeout dell'audit.",
          helpUrl: "",
          tags: [],
          nodes: [],
        },
      ],
    });
    console.log(`AXE_ROUTE_ERROR ${area} ${String(error)}`);
  }
}

test.describe.configure({ mode: "serial" });

test.describe("Audit accessibilità (axe-core, WCAG 2.1 A+AA) — sola verifica", () => {
  test("rotte pubbliche", async ({ page, testUsers }) => {
    test.setTimeout(120_000);
    // Un articolo pubblicato e un profilo utente reali servono per le route
    // dinamiche pubbliche (/articoli/[id], /utenti/[id]).
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const articleId = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Articolo audit a11y ${stamp}`,
      categoriaNome: `Categoria audit a11y ${stamp}`,
    });
    const iscritto = await testUsers.create();
    const iscrittoId = await getUserId(iscritto.email);

    const routes: Array<[string, string]> = [
      ["Home", "/"],
      ["Esplora Articoli", "/esplora"],
      ["Chi Siamo", "/chi-siamo"],
      ["Cookie Policy", "/cookie-policy"],
      ["Termini", "/termini"],
      ["Informativa Privacy", "/informativa-privacy"],
      ["Dichiarazione di Accessibilità", "/accessibilita"],
      ["Login", "/login"],
      ["Registrazione", "/registrazione"],
      ["Recupero Password", "/recupero-password"],
      ["Dettaglio Articolo", `/articoli/${articleId}`],
      ["Profilo Pubblico Utente", `/utenti/${iscrittoId}`],
    ];

    for (const [area, path] of routes) {
      await auditRoute(page, `Pubblico — ${area}`, path);
    }

    // Stesso motivo di "rotte Manager Autori" sotto: senza questo, il
    // cleanup dell'utente in fixtures.ts fallisce con una FK violation su
    // articoli_autore_id_fkey (deleteTestUser non tocca gli articoli).
    await deleteArticle(manager.email, manager.password, articleId);
  });

  test("rotte Iscritto", async ({ page, testUsers }) => {
    test.setTimeout(120_000);
    const iscritto = await testUsers.create();
    await loginViaUi(page, iscritto.email, iscritto.password);

    const routes: Array<[string, string]> = [
      ["Panoramica Account", "/account"],
      ["I Miei Dati", "/account/dati"],
      ["Impostazioni Profilo", "/account/impostazioni"],
      ["I Miei Salvataggi", "/account/salvataggi"],
      ["Elimina Account", "/account/elimina"],
    ];

    for (const [area, path] of routes) {
      await auditRoute(page, `Iscritto — ${area}`, path);
    }
  });

  test("rotte Autore", async ({ page, testUsers }) => {
    test.setTimeout(120_000);
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const draftId = await createDraftArticle(autore.email, autore.password, {
      titolo: `Bozza audit a11y ${stamp}`,
      categoriaNome: `Categoria audit a11y autore ${stamp}`,
    });

    await loginViaUi(page, autore.email, autore.password);

    const routes: Array<[string, string]> = [
      ["Dashboard Autore", "/autore"],
      ["I Miei Articoli", "/autore/articoli"],
      ["Nuovo Articolo", "/autore/articoli/nuovo"],
      ["Modifica Articolo (bozza esistente)", `/autore/articoli/${draftId}/modifica`],
      ["Le Mie Bozze", "/autore/bozze"],
      ["Categorie (Autore)", "/autore/categorie"],
    ];

    for (const [area, path] of routes) {
      await auditRoute(page, `Autore — ${area}`, path);
    }

    await deleteDraftArticle(autore.email, autore.password, draftId);
  });

  test("rotte Manager Autori", async ({ page, testUsers }) => {
    test.setTimeout(120_000);
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const pendingId = await createPendingArticle(manager.email, manager.password, {
      titolo: `Articolo in attesa audit a11y ${stamp}`,
      categoriaNome: `Categoria audit a11y manager ${stamp}`,
    });

    await loginViaUi(page, manager.email, manager.password);

    const routes: Array<[string, string]> = [
      ["Dashboard Manageriale", "/manager"],
      ["Articoli in Attesa di Approvazione", "/manager/articoli-in-attesa"],
      ["Revisione Articolo", `/manager/articoli-in-attesa/${pendingId}`],
      ["Gestione Autori", "/manager/autori"],
      ["Gestione Categorie (Manager)", "/manager/categorie"],
    ];

    for (const [area, path] of routes) {
      await auditRoute(page, `Manager Autori — ${area}`, path);
    }

    // Senza questo, il cleanup dell'utente in fixtures.ts (deleteTestUser, che
    // non tocca affatto gli articoli dell'autore) fallisce con una FK
    // violation su articoli_autore_id_fkey — stesso pattern di deleteArticle,
    // cfr. il commento sul suo warning in test-articles.ts.
    await deleteArticle(manager.email, manager.password, pendingId);
  });

  test("rotte Gestore Utenti", async ({ page, testUsers }) => {
    test.setTimeout(120_000);
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const targetSegnalazione = await testUsers.create();
    const reporter = await testUsers.create();
    const targetCancellazione = await testUsers.create();
    const targetScheda = await testUsers.create();
    const stamp = Date.now();
    const motivazioneSegnalazione = `Motivazione audit a11y ${stamp}`;

    const targetSegnalazioneId = await getUserId(targetSegnalazione.email);
    const targetSchedaId = await getUserId(targetScheda.email);

    // reportUser (POST /utenti/segnalazioni) non restituisce l'id: come gli
    // altri test su questa pagina (gestore-segnalazioni.spec.ts), si passa
    // dalla coda e si clicca "Esamina" per arrivare al dettaglio.
    await reportUser(reporter.email, reporter.password, targetSegnalazioneId, motivazioneSegnalazione);
    await requestAccountDeletion(targetCancellazione.email, targetCancellazione.password);

    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
    await loginViaUi(page, gestore.email, gestore.password);

    const routes: Array<[string, string]> = [
      ["Dashboard Gestione Utenti", "/gestore"],
      ["Cronologia Azioni Amministrative", "/gestore/cronologia"],
      ["Gestione Account", "/gestore/gestione-account"],
      ["Scheda Utente", `/gestore/gestione-account/${targetSchedaId}`],
      ["Richieste di Cancellazione", "/gestore/richieste-cancellazione"],
      ["Ricorsi", "/gestore/ricorsi"],
      ["Coda Segnalazioni", "/gestore/segnalazioni"],
    ];

    for (const [area, path] of routes) {
      await auditRoute(page, `Gestore Utenti — ${area}`, path);
    }

    await page.goto("/gestore/segnalazioni");
    await page.locator("tr", { hasText: motivazioneSegnalazione }).getByRole("link", { name: "Esamina" }).click();
    await page.waitForURL(/\/gestore\/segnalazioni\/\d+/);
    await page.waitForLoadState("networkidle").catch(() => {});
    const detailResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    report.push({
      area: "Gestore Utenti — Dettaglio Segnalazione",
      path: page.url(),
      violations: detailResults.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.map((n) => ({
          target: n.target as string[],
          html: n.html,
          failureSummary: n.failureSummary,
        })),
      })),
    });
  });

  test("scrivi report", async () => {
    const dir = "/tmp/claude-1000/-home-samuele-Desktop-MotorMindHub-motormindhub-web/93ceab03-e221-4297-af59-7b8478d58f88/scratchpad";
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/axe-report.json`, JSON.stringify(report, null, 2));

    const totalViolations = report.reduce((sum, r) => sum + r.violations.length, 0);
    console.log(`AXE_REPORT_SUMMARY routes=${report.length} totalViolations=${totalViolations}`);
    expect(report.length).toBeGreaterThan(0);
  });
});
