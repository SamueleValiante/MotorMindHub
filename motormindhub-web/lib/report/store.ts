import { create } from "zustand";

interface ReportModalState {
  isOpen: boolean;
  segnalatoId: number | null;
  segnalatoNome: string | null;
  open: (segnalatoId: number, segnalatoNome?: string) => void;
  close: () => void;
}

/**
 * Store globale (stesso pattern di lib/toast e lib/cookie-consent):
 * qualunque punto dell'app (profilo pubblico oggi, in futuro articoli o
 * commenti) apre il modale chiamando openReportModal(id, nome) senza
 * dover renderizzare un proprio <ReportUserModal> né passare stato via
 * props — il componente è montato una sola volta nel root layout.
 */
export const useReportModalStore = create<ReportModalState>((set) => ({
  isOpen: false,
  segnalatoId: null,
  segnalatoNome: null,
  open: (segnalatoId, segnalatoNome) =>
    set({ isOpen: true, segnalatoId, segnalatoNome: segnalatoNome ?? null }),
  close: () => set({ isOpen: false, segnalatoId: null, segnalatoNome: null }),
}));

export function openReportModal(segnalatoId: number, segnalatoNome?: string): void {
  useReportModalStore.getState().open(segnalatoId, segnalatoNome);
}
