"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LinkToConfermaEmailFixtureContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div className="p-8">
      <Link href={`/conferma-email?token=${encodeURIComponent(token)}`}>Vai alla conferma email</Link>
    </div>
  );
}
