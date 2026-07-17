"use client";

import { toast } from "@/lib/toast/toast";

export function ToastTriggerButton() {
  return (
    <button type="button" onClick={() => toast.info("Toast di prova")}>
      Mostra toast
    </button>
  );
}
