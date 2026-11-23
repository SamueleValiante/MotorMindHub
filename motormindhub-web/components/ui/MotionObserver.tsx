"use client";

import { useEffect } from "react";

const LOADER = "[data-mmh-loader]";
/** Elementi con un ingresso proprio: non vanno toccati (cambiarne l'animazione la farebbe ripartire). */
const OWN_MOTION = ".mmh-fade, .mmh-rise, .mmh-bg, .mmh-own-motion, .mmh-page";
/** Indice massimo di cascata: oltre, gli elementi entrano tutti insieme all'ultimo passo. */
const MAX_INDEX = 8;
/** Fine sicura della cascata interna (8 × 70ms + 1.2s), con margine. */
const KIDS_DONE_MS = 2200;
/** Oltre questo numero di figli la cascata interna non si nota più: entra il blocco intero. */
const MAX_STAGGER_CHILDREN = 40;

function containsLoader(node: Node): boolean {
  return node instanceof Element && (node.matches(LOADER) || node.querySelector(LOADER) !== null);
}

/**
 * Le classi d'ingresso restano sull'elemento (non vengono rimosse): con
 * fill-mode "backwards", a fine corsa non lasciano alcuno stile applicato, e
 * rimuoverle cambierebbe animation-name, facendo ripartire l'eventuale
 * animazione di un'altra regola. La cascata sui figli invece si spegne a fine
 * corsa (data-mmh-done): un figlio aggiunto più tardi (es. un messaggio di
 * errore in un form) non deve essere ritardato.
 */
function appear(items: Element[]) {
  if (items.length === 1) {
    const [el] = items;
    const display = getComputedStyle(el).display;
    const childCount = el.childElementCount;
    // Un unico contenitore a griglia/flex (lista di card, statistiche, risultati):
    // il contenitore si dissolve e i suoi elementi emergono uno dopo l'altro.
    if (/flex|grid/.test(display) && childCount >= 2 && childCount <= MAX_STAGGER_CHILDREN) {
      el.classList.add("mmh-appear-soft", "mmh-appear-kids");
      window.setTimeout(() => el.setAttribute("data-mmh-done", ""), KIDS_DONE_MS);
      return;
    }
    el.classList.add("mmh-appear");
    return;
  }
  // Più blocchi insieme (es. un frammento con statistiche + sezioni): cascata tra i blocchi.
  items.forEach((el, i) => {
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      el.style.setProperty("--mmh-i", String(Math.min(i, MAX_INDEX)));
    }
    el.classList.add("mmh-appear");
  });
}

/**
 * Montato una volta nel layout radice. Quando un indicatore di caricamento
 * (LoadingDots, data-mmh-loader) dentro una pagina viene sostituito dal
 * contenuto — a qualunque profondità e in qualunque momento — il contenuto
 * entra con l'animazione del sito invece di comparire di colpo.
 *
 * Funziona perché React rimuove il segnaposto e inserisce il contenuto nello
 * stesso commit: il MutationObserver riceve entrambe le modifiche nello
 * stesso lotto, e la sua callback gira come microtask PRIMA del paint, quindi
 * le classi d'animazione sono già al loro posto al primo fotogramma.
 *
 * Agisce solo DENTRO una pagina (.mmh-page) e mai sulla sua radice: la
 * sostituzione al livello radice la gestisce già PageTransition, e ciò che
 * sta fuori dalla pagina (es. RoleGuard → sidebar + main, dove React riusa
 * lo stesso <div> e ne cambia solo i figli) ha già il proprio ingresso.
 */
export function MotionObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new MutationObserver((records) => {
      const byParent = new Map<Element, { loaderGone: boolean; added: Element[] }>();
      for (const record of records) {
        const target = record.target;
        if (record.type !== "childList" || !(target instanceof Element)) continue;
        if (target.classList.contains("mmh-page") || !target.closest(".mmh-page")) continue;
        let entry = byParent.get(target);
        if (!entry) {
          entry = { loaderGone: false, added: [] };
          byParent.set(target, entry);
        }
        const current = entry;
        record.removedNodes.forEach((node) => {
          if (containsLoader(node)) current.loaderGone = true;
        });
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) current.added.push(node);
        });
      }

      for (const { loaderGone, added } of byParent.values()) {
        if (!loaderGone) continue;
        const items = added.filter((el) => el.isConnected && !el.matches(LOADER) && !el.matches(OWN_MOTION));
        if (items.length > 0) appear(items);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
