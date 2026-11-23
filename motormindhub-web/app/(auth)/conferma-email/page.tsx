import { Suspense } from "react";
import { ConfirmEmailContent } from "./ConfirmEmailContent";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function ConfermaEmailPage() {
  return (
    <Suspense fallback={<LoadingDots variant="section" />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
