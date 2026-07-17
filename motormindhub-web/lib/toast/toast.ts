import { useToastStore, type ToastVariant } from "./store";

const DEFAULT_DURATION_MS = 5000;

function show(
  variant: ToastVariant,
  message: string,
  durationMs = DEFAULT_DURATION_MS
): string {
  const id = useToastStore.getState().push(variant, message);
  if (durationMs > 0) {
    setTimeout(() => useToastStore.getState().dismiss(id), durationMs);
  }
  return id;
}

/**
 * API imperativa da importare ovunque serva mostrare un feedback (submit
 * di un form, esito di una apiFetch, ecc.): non richiede un hook né di
 * stare dentro un provider specifico, solo che <ToastViewport /> sia
 * montato una volta nel root layout (già fatto).
 */
export const toast = {
  success: (message: string, durationMs?: number) =>
    show("success", message, durationMs),
  error: (message: string, durationMs?: number) =>
    show("error", message, durationMs),
  info: (message: string, durationMs?: number) =>
    show("info", message, durationMs),
};
