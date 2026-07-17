"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth/passwordReset";
import { toast } from "@/lib/toast/toast";
import { ResultPanel } from "@/components/auth/ResultPanel";
import { CheckCircleIcon, ErrorCircleIcon } from "@/components/auth/icons";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

// Rispecchia PasswordSicuraValidator del backend, come in registrazione:
// solo per il feedback nativo immediato del browser.
const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <ResultPanel
        icon={<ErrorCircleIcon className="h-7 w-7" />}
        title="Link non valido"
        description="Link di reimpostazione non valido: manca il token."
        action={{ label: "Richiedi un nuovo link", href: "/recupero-password" }}
      />
    );
  }

  if (done) {
    return (
      <ResultPanel
        icon={<CheckCircleIcon className="h-7 w-7" />}
        title="Password aggiornata"
        description="La tua password è stata reimpostata con successo."
        action={{ label: "Vai al login", href: "/login" }}
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono.");
      return;
    }

    setSubmitting(true);
    const ok = await resetPassword(token, password);
    setSubmitting(false);
    if (ok) {
      setDone(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Reimposta password
        </h1>
        <p className="mt-2 text-sm text-fog">Scegli una nuova password sicura per il tuo account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClassName}>
            Nuova password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            pattern={PASSWORD_PATTERN}
            title="Minimo 8 caratteri, con almeno una maiuscola, una minuscola, un numero e un simbolo."
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className={labelClassName}>
            Conferma password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
          />
          <p className="text-xs text-fog">
            Minimo 8 caratteri, con almeno una maiuscola, una minuscola, un numero e un simbolo.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Reimpostazione in corso…" : "Reimposta password"}
        </button>
      </form>
    </div>
  );
}
