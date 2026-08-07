"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/passwordReset";
import { ResultPanel } from "@/components/auth/ResultPanel";
import { MailIcon } from "@/components/auth/icons";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

export default function RecuperoPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const ok = await requestPasswordReset(email);
    setSubmitting(false);
    if (ok) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <ResultPanel
        icon={<MailIcon className="h-7 w-7" />}
        title="Controlla la tua email"
        description="Se l'indirizzo che hai inserito è associato a un account attivo, riceverai un'email con le istruzioni per reimpostare la password."
        action={{ label: "Torna al login", href: "/login" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Password dimenticata?
        </h1>
        <p className="mt-2 text-sm text-fog">Ti invieremo un link sicuro per reimpostarla</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Invio in corso…" : "Invia link di recupero"}
        </button>
      </form>

      <p className="text-center text-sm text-accent">
        <Link href="/login">← Torna al login</Link>
      </p>
    </div>
  );
}
