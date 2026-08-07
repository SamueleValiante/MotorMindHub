"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type CurrentUser } from "@/lib/auth/useCurrentUser";
import { updateProfile } from "@/lib/auth/updateProfile";
import { ImageUploadField } from "@/components/shared/ImageUploadField";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

interface ProfileSettingsFormProps {
  user: CurrentUser;
  /**
   * Dove tornare su Annulla e dopo un salvataggio riuscito — la Panoramica
   * del proprio ruolo: /account per ISCRITTO, /autore per AUTORE, /manager
   * per MANAGER_AUTORI. Nessun default: ogni chiamante ha una destinazione
   * diversa, sbagliarla per omissione sarebbe peggio di doverla scrivere.
   */
  redirectTo: string;
}

// Form non controllato (defaultValue, non value) montato solo quando user è
// pronto: evita di dover "sincronizzare" stato locale da un fetch asincrono
// dentro un effetto (react-hooks/set-state-in-effect), qui non c'è alcuno
// stato da sincronizzare dopo il mount iniziale.
/**
 * Condiviso da /account/impostazioni (ISCRITTO), /autore/impostazioni
 * (AUTORE) e /manager/impostazioni (MANAGER_AUTORI): stesso form, stesso
 * endpoint (PUT /utenti/me), stessa validazione — cambia solo dove si
 * torna dopo. Nessun equivalente per GESTORE_UTENTI: GET /utenti/me
 * respinge quel ruolo con 403 by design (RAD 3.2.4,
 * SelfServiceAuthorizationIntegrationTest), quindi non ha un'area
 * self-service da collegare qui.
 */
export function ProfileSettingsForm({ user, redirectTo }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [fotoProfilo, setFotoProfilo] = useState<string | null>(user.fotoProfilo);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSubmitting(true);
    const ok = await updateProfile({
      nome: String(formData.get("nome")),
      cognome: String(formData.get("cognome")),
      fotoProfilo,
      biografia: String(formData.get("biografia") || "") || null,
    });
    setSubmitting(false);

    if (ok) {
      router.push(redirectTo);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-lg bg-carbon p-6">
      <p className={labelClassName}>Foto profilo</p>
      <div className="mt-2">
        <ImageUploadField
          variant="avatar"
          value={fotoProfilo}
          onChange={setFotoProfilo}
          endpoint="/api/v1/utenti/me/foto-profilo"
          maxSizeBytes={2 * 1024 * 1024}
          label="Carica nuova foto"
          nome={user.nome}
          cognome={user.cognome}
        />
      </div>

      <div className="mt-6 flex flex-col gap-2">
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
          defaultValue={user.nome}
          className={inputClassName}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
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
          defaultValue={user.cognome}
          className={inputClassName}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        {/* Non editabile: UpdateProfileDTO non ha un campo email, il cambio email non è supportato da RF1.6. */}
        <input
          id="email"
          type="email"
          disabled
          value={user.email}
          className={`${inputClassName} cursor-not-allowed opacity-60`}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor="biografia" className={labelClassName}>
          Biografia
        </label>
        <textarea
          id="biografia"
          name="biografia"
          rows={4}
          maxLength={1000}
          defaultValue={user.biografia ?? ""}
          className={`${inputClassName} resize-none`}
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-4 border-t border-paper/10 pt-6">
        <Link
          href={redirectTo}
          className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Salvataggio…" : "Salva modifiche"}
        </button>
      </div>
    </form>
  );
}
