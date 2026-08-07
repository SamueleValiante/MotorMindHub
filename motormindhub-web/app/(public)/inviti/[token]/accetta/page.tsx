"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast/toast";
import { acceptInvite, declineInvite } from "@/lib/autori/inviteResponse";
import { Logo } from "@/components/brand/Logo";
import { PeopleIcon } from "@/components/manager/icons";
import { CheckCircleIcon, ErrorCircleIcon } from "@/components/auth/icons";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent";
const labelClassName = "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";
// Rispecchia PasswordSicuraValidator del backend, come registrazione/reimposta-password.
const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}";

type View =
  | { step: "choice" }
  | { step: "accept-form" }
  | { step: "result"; success: boolean; message: string };

/**
 * Mockup 33, UC_9/UC_10. URL fissato dal backend (GestioneNotifiche.
 * onAuthorInvited): /inviti/{token}/accetta — non spostare senza
 * aggiornare anche l'email inviata dal backend. Vive sotto (public) per
 * ereditare PublicHeader/PublicFooter (il mockup mostra la nav pubblica
 * completa), non la card minimale di (auth).
 *
 * Nessuna chiamata di lettura all'apertura: non esiste un endpoint per
 * leggere i dettagli dell'invito (mittente, ruolo proposto) prima di
 * agire, quindi non si può personalizzare il testo come nel mockup. Si
 * mostra subito la scelta e si gestisce l'esito (incluso token scaduto/
 * già usato) al momento della submit — stesso trattamento di
 * ResetPasswordForm per reimposta-password.
 */
export default function AccettaInvitoPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [view, setView] = useState<View>({ step: "choice" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleDecline = async () => {
    setPending(true);
    const result = await declineInvite(token);
    setPending(false);

    setView(
      result.ok
        ? { step: "result", success: true, message: "Invito rifiutato. Nessun account è stato creato." }
        : { step: "result", success: false, message: result.message }
    );
  };

  const handleAccept = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Le password non coincidono.");
      return;
    }

    setPending(true);
    const result = await acceptInvite(token, password);
    setPending(false);

    setView(
      result.ok
        ? {
            step: "result",
            success: true,
            message: "Il tuo account è stato attivato. Ora puoi accedere con la password scelta.",
          }
        : { step: "result", success: false, message: result.message }
    );
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="mb-8 flex justify-center">
          <Logo className="h-16 w-16" />
        </div>

        {view.step === "result" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                view.success ? "bg-accent/10 text-accent" : "bg-ember/10 text-ember"
              }`}
            >
              {view.success ? <CheckCircleIcon className="h-7 w-7" /> : <ErrorCircleIcon className="h-7 w-7" />}
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">
                {view.success ? "Fatto" : "Link non valido"}
              </h1>
              <p className="text-sm text-fog">{view.message}</p>
            </div>
            <Link
              href={view.success ? "/login" : "/"}
              className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
            >
              {view.success ? "Vai al login" : "Torna alla home"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
              <PeopleIcon className="h-7 w-7" />
            </div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">
              Sei stato invitato
            </h1>
            <p className="text-sm text-fog">
              Il Manager degli Autori di MotorMindHub ti ha invitato a entrare nel team editoriale.
            </p>

            {view.step === "choice" ? (
              <div className="mt-2 grid w-full grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void handleDecline()}
                  disabled={pending}
                  className="rounded-md border border-paper/20 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
                >
                  {pending ? "…" : "Rifiuta"}
                </button>
                <button
                  type="button"
                  onClick={() => setView({ step: "accept-form" })}
                  className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
                >
                  Accetta
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void handleAccept(event)} className="mt-2 flex w-full flex-col gap-5 text-left">
                <div className="flex flex-col gap-2">
                  <label htmlFor="invito-password" className={labelClassName}>
                    Scegli una password
                  </label>
                  <input
                    id="invito-password"
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
                  <label htmlFor="invito-conferma-password" className={labelClassName}>
                    Conferma password
                  </label>
                  <input
                    id="invito-conferma-password"
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

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setView({ step: "choice" })}
                    disabled={pending}
                    className="rounded-md border border-paper/20 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
                  >
                    {pending ? "Attendere…" : "Conferma"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
