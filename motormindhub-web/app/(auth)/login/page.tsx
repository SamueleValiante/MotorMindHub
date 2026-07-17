"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth/login";
import { ROLE_HOME_PATH } from "@/lib/auth/roleRedirect";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.ok && result.ruolo) {
      router.push(ROLE_HOME_PATH[result.ruolo]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Bentornato
        </h1>
        <p className="mt-2 text-sm text-fog">
          Accedi per continuare a esplorare MotorMindHub
        </p>
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClassName}>
              Password
            </label>
            <Link
              href="/recupero-password"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-amber"
            >
              Dimenticata?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>

      <p className="text-center text-sm text-fog">
        Non hai un account?{" "}
        <Link href="/registrazione" className="font-semibold text-amber">
          Registrati
        </Link>
      </p>
    </div>
  );
}
