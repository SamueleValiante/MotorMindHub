import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function ReimpostaPasswordPage() {
  return (
    <Suspense fallback={<LoadingDots variant="section" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
