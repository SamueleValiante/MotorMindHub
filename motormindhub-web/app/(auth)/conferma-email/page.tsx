import { Suspense } from "react";
import { ConfirmEmailContent } from "./ConfirmEmailContent";

export default function ConfermaEmailPage() {
  return (
    <Suspense fallback={<p className="mmh-loading text-center text-sm text-fog">Caricamento…</p>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
