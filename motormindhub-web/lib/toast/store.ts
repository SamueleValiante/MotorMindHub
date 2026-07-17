import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (variant: ToastVariant, message: string) => string;
  dismiss: (id: string) => void;
}

/**
 * Store globale, solo client (stesso pattern di lib/auth/store.ts): un
 * toast va invocato da qualunque azione mutante di qualunque sottosistema
 * (submit di un form, esito di un apiFetch, ecc.) senza dover incapsulare
 * il chiamante in un provider specifico o passare callback via props.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (variant, message) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, variant, message }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
