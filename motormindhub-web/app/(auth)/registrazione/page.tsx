"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/lib/auth/register";
import { ResultPanel } from "@/components/auth/ResultPanel";
import { MailIcon } from "@/components/auth/icons";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

// Rispecchia PasswordSicuraValidator del backend (motormindhub-api): solo
// per il feedback nativo immediato del browser, il backend resta l'unica
// fonte di verità (nessuna riconferma della regola in JS).
const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}";

export default function RegistrazionePage() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consensoPrivacy, setConsensoPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const ok = await register({ nome, cognome, email, password, consensoPrivacy });
    setSubmitting(false);
    if (ok) {
      setRegisteredEmail(email);
    }
  };

  if (registeredEmail) {
    return (
      <ResultPanel
        icon={<MailIcon className="h-7 w-7" />}
        title="Controlla la tua email"
        description={
          <>
            Abbiamo inviato un link di conferma a{" "}
            <span className="font-semibold text-paper">{registeredEmail}</span>.
            <br />
            <br />
            Clicca sul link contenuto nell&apos;email per attivare il tuo account.
            Se non lo trovi, controlla anche nello spam.
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Crea il tuo account
        </h1>
        <p className="mt-2 text-sm text-fog">Unisciti alla community MotorMindHub</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={labelClassName}>
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            maxLength={100}
            autoComplete="given-name"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="cognome" className={labelClassName}>
            Cognome
          </label>
          <input
            id="cognome"
            name="cognome"
            type="text"
            required
            maxLength={100}
            autoComplete="family-name"
            value={cognome}
            onChange={(event) => setCognome(event.target.value)}
            className={inputClassName}
          />
        </div>

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
          <label htmlFor="password" className={labelClassName}>
            Password
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
          <p className="text-xs text-fog">
            Minimo 8 caratteri, con almeno una maiuscola, una minuscola, un numero e un simbolo.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-chrome">
          <input
            type="checkbox"
            required
            checked={consensoPrivacy}
            onChange={(event) => setConsensoPrivacy(event.target.checked)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span>
            Accetto i{" "}
            <Link href="/termini" className="text-accent underline">
              Termini di Servizio
            </Link>{" "}
            e ho letto l&apos;
            <Link href="/informativa-privacy" className="text-accent underline">
              Informativa Privacy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Creazione in corso…" : "Crea account"}
        </button>
      </form>

      <p className="text-center text-sm text-fog">
        Hai già un account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Accedi
        </Link>
      </p>
    </div>
  );
}
