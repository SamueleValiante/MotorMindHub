import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
}

interface UseFocusTrapOptions {
  isOpen: boolean;
  /** Chiamato su Escape. Assente = Escape non fa nulla (nessun modale tra i 5 correnti lo lascia assente, ma un futuro caso non distruttivo potrebbe volerlo). */
  onClose?: () => void;
  /**
   * Solo per contenitori con più sotto-viste interne che cambiano senza
   * chiudere/riaprire il container (oggi solo CookieBanner: passa
   * showCustomize). Quando cambia mentre isOpen=true, sposta di nuovo il
   * focus sul nuovo elemento [data-focus-trap-initial] - senza questo, la
   * cattura del trigger e l'attach del listener Tab/Escape (che devono
   * restare stabili per tutta l'apertura, non ripartire ad ogni cambio di
   * sotto-vista) non c'entrano nulla con "quale elemento prende il focus
   * ora", quindi è un effect separato con le sue dipendenze.
   */
  focusKey?: unknown;
}

/**
 * Comportamento condiviso da SuspendAccountModal, ConfirmDeleteModal,
 * ConfirmDeletionModal, ReportUserModal, CookieBanner (non un componente
 * wrapper: troppo diversi strutturalmente, CookieBanner in particolare non
 * ha overlay/backdrop ed ha due sotto-viste - solo il comportamento e'
 * condiviso, non il markup):
 *
 * 1. All'apertura (e ad ogni cambio di focusKey) sposta il focus dentro il
 *    container, sull'elemento marcato [data-focus-trap-initial] se presente
 *    (tipicamente l'heading, per annunciare il contesto prima di un
 *    controllo - pattern WAI-ARIA APG), altrimenti sul primo elemento
 *    interattivo.
 * 2. Intrappola Tab/Shift+Tab dentro gli elementi interattivi *visibili*
 *    del container (ricalcolati ad ogni pressione, non uno snapshot -
 *    serve per campi condizionali come le note aggiuntive di
 *    SuspendAccountModal).
 * 3. Chiude su Escape, se onClose e' passato.
 * 4. Ripristina il focus sul trigger (l'elemento a fuoco prima
 *    dell'apertura) alla chiusura, sia via Escape sia via smontaggio.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  isOpen,
  onClose,
  focusKey,
}: UseFocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // I chiamanti (es. SuspendAccountModal in app/gestore/gestione-account/[userId]/page.tsx)
  // passano onCancel come funzione inline, quindi una nuova referenza ad ogni render del
  // genitore - non nel dependency array dell'effect sotto per questo motivo: altrimenti
  // l'effect si rieseguirebbe ad ogni render (non solo apertura/chiusura), ricatturando
  // document.activeElement mentre l'utente e' gia' dentro il modale invece del trigger
  // originale. Il ref tiene sempre l'ultima callback senza forzare il re-run dell'effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Cattura il trigger PRIMA di spostare il focus (effect dichiarato prima
  // di quello sotto che sposta il focus sul marker iniziale - React esegue
  // gli effect dello stesso componente nell'ordine di dichiarazione, quindi
  // l'ordine qui non è cosmetico: invertito, questo effect catturerebbe
  // come "trigger" l'heading appena focussato dall'altro effect invece del
  // vero elemento esterno che ha aperto il container).
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  // Effect separato (invece che nel blocco sopra): deve rieseguire quando
  // cambia focusKey, ma senza ricatturare triggerRef o riattaccare il
  // listener Tab/Escape, che vanno fatti una sola volta per apertura.
  // Dichiarato DOPO l'effect sopra, cosicché il trigger sia già catturato
  // quando questo sposta il focus.
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;
    const initial =
      container.querySelector<HTMLElement>("[data-focus-trap-initial]") ?? getFocusable(container)[0];
    initial?.focus();
  }, [isOpen, focusKey]);

  return containerRef;
}
