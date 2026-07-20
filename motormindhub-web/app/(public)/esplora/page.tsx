import { Suspense } from "react";
import { EsploraContent } from "./EsploraContent";

export default function EsploraPage() {
  return (
    <Suspense fallback={<p className="p-12 text-center text-sm text-fog">Caricamento…</p>}>
      <EsploraContent />
    </Suspense>
  );
}
