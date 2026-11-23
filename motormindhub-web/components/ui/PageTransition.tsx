"use client";

import { useEffect, useRef } from "react";

/**
 * Durata massima dell'ingresso di una pagina: --mmh-content-start (160ms)
 * + 8 passi di cascata (8 × 120ms) + --mmh-dur (1.2s) ≈ 2.3s, con margine.
 */
const SETTLE_MS = 2600;

/**
 * Wrapper delle template.tsx: Next rimonta la template a ogni navigazione,
 * quindi la pagina entra con la coreografia di globals.css (.mmh-page):
 * la radice si dissolve, i suoi blocchi emergono a cascata.
 *
 * A fine ingresso ogni radice viene marcata data-mmh-settled: da lì in poi
 * gli elementi che compaiono dentro di essa (un messaggio di errore, una
 * riga aggiunta) non vengono più ritardati dalla cascata. Una radice NUOVA
 * (es. il contenuto che sostituisce il segnaposto "Caricamento…") non è
 * marcata, quindi entra con la stessa coreografia, e viene marcata a sua
 * volta SETTLE_MS dopo. display: contents: nessun impatto sul layout.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const timers = new Set<number>();
    const settleLater = (el: Element) => {
      const id = window.setTimeout(() => {
        el.setAttribute("data-mmh-settled", "");
        timers.delete(id);
      }, SETTLE_MS);
      timers.add(id);
    };
    Array.from(host.children).forEach(settleLater);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) settleLater(node);
        });
      }
    });
    observer.observe(host, { childList: true });
    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div ref={ref} className="mmh-page">
      {children}
    </div>
  );
}
