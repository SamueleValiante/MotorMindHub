"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/http/client";
import { ResultPanel } from "@/components/auth/ResultPanel";
import { CheckCircleIcon, ErrorCircleIcon } from "@/components/auth/icons";

type Status = "loading" | "success" | "error";

interface ApiMessageBody {
  message?: string;
  messages?: string[];
}

export function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  // Il token e' monouso: in dev React StrictMode invoca l'effect due volte
  // (mount -> cleanup -> mount) sullo stesso componente. Senza questa
  // guardia la seconda invocazione arriverebbe con un token gia' consumato
  // dalla prima, mostrando un falso "link non valido". Tiene il VALORE del
  // token già richiesto (non un semplice booleano) per lo stesso motivo di
  // requestedIdRef in useArticle/useEditableArticle: la validità della
  // risposta si verifica confrontando requestedTokenRef.current con il
  // token di quella specifica richiesta, non con un flag `cancelled` locale
  // all'effetto — quel flag veniva impostato a true dalla cleanup sincrona
  // del replay mount -> cleanup -> mount di StrictMode, prima ancora che la
  // fetch potesse risolversi, e la guardia sopra impediva al remount di
  // avviarne una seconda: l'UNICA fetch rimasta in volo (quella reale, che
  // consuma il token una sola volta) veniva sempre scartata al suo arrivo,
  // bloccando la pagina su "Verifica in corso…" per sempre. Bug gemello di
  // quello in useArticle/useEditableArticle — qui raggiungibile solo da una
  // navigazione client-side interna (un <Link>), non da un page.goto
  // diretto (il caso reale più comune: si arriva quasi sempre da un link
  // email esterno).
  const requestedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || requestedTokenRef.current === token) {
      return;
    }
    requestedTokenRef.current = token;
    const targetToken = token;

    apiFetch(`/api/v1/utenti/verifica-email?token=${encodeURIComponent(targetToken)}`, {
      skipAuth: true,
    })
      .then(async (response) => {
        if (requestedTokenRef.current !== targetToken) return;
        const body: ApiMessageBody = await response.json().catch(() => ({}));
        if (response.ok) {
          setStatus("success");
          setMessage(body.message ?? "Account attivato con successo.");
        } else {
          setStatus("error");
          setMessage(body.messages?.[0] ?? "Non è stato possibile verificare l'account.");
        }
      })
      .catch(() => {
        if (requestedTokenRef.current === targetToken) {
          setStatus("error");
          setMessage("Impossibile contattare il server. Riprova più tardi.");
        }
      });
  }, [token]);

  if (!token) {
    return (
      <ResultPanel
        icon={<ErrorCircleIcon className="h-7 w-7" />}
        title="Link non valido"
        description="Link di conferma non valido: manca il token."
        action={{ label: "Torna al login", href: "/login" }}
      />
    );
  }

  if (status === "loading") {
    return <p className="text-center text-sm text-fog">Verifica in corso…</p>;
  }

  if (status === "success") {
    return (
      <ResultPanel
        icon={<CheckCircleIcon className="h-7 w-7" />}
        title="Account attivato"
        description={message}
        action={{ label: "Vai al login", href: "/login" }}
      />
    );
  }

  return (
    <ResultPanel
      icon={<ErrorCircleIcon className="h-7 w-7" />}
      title="Link non valido"
      description={message}
      action={{ label: "Torna al login", href: "/login" }}
    />
  );
}
