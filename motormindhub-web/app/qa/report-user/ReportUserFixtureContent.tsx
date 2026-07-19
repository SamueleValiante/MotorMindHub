"use client";

import { useSearchParams } from "next/navigation";
import { ReportButton } from "@/components/report/ReportButton";

export function ReportUserFixtureContent() {
  const searchParams = useSearchParams();
  const segnalatoId = Number(searchParams.get("segnalatoId"));
  const segnalatoNome = searchParams.get("segnalatoNome") ?? undefined;

  return (
    <div className="p-8">
      <ReportButton
        segnalatoId={segnalatoId}
        segnalatoNome={segnalatoNome}
        className="rounded-md bg-carbon px-4 py-2 text-paper"
      >
        Segnala profilo
      </ReportButton>
    </div>
  );
}
