"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser, type CurrentUser } from "@/lib/auth/useCurrentUser";
import { updateProfile } from "@/lib/auth/updateProfile";
import { Avatar } from "@/components/shared/Avatar";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber";
const labelClassName =
  "font-heading text-xs font-semibold uppercase tracking-wide text-chrome";

// Form non controllato (defaultValue, non value) montato solo quando user è
// pronto: evita di dover "sincronizzare" stato locale da un fetch asincrono
// dentro un effetto (react-hooks/set-state-in-effect), qui non c'è alcuno
// stato da sincronizzare dopo il mount iniziale.
function SettingsForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSubmitting(true);
    const ok = await updateProfile({
      nome: String(formData.get("nome")),
      cognome: String(formData.get("cognome")),
      fotoProfilo: user.fotoProfilo,
      biografia: String(formData.get("biografia") || "") || null,
    });
    setSubmitting(false);

    if (ok) {
      router.push("/account");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-lg bg-carbon p-6">
      {/* Il mockup 16 mostra un pulsante "Carica nuova foto": nessun endpoint
          di storage nel backend (UpdateProfileDTO.fotoProfilo è solo una
          stringa, senza un canale di upload) — mostrata in sola lettura. */}
      <p className={labelClassName}>Foto profilo</p>
      <div className="mt-2">
        <Avatar nome={user.nome} cognome={user.cognome} fotoProfilo={user.fotoProfilo} />
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
          href="/account"
          className="font-heading text-sm font-bold uppercase tracking-wide text-chrome"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-60"
        >
          {submitting ? "Salvataggio…" : "Salva modifiche"}
        </button>
      </div>
    </form>
  );
}

export default function ImpostazioniProfiloPage() {
  const { user, loading } = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area personale</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Impostazioni profilo
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : user ? (
        <SettingsForm user={user} />
      ) : (
        <p className="text-sm text-ember">Non è stato possibile caricare i tuoi dati.</p>
      )}
    </div>
  );
}
