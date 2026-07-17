import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ReimpostaPasswordPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-fog">Caricamento…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
