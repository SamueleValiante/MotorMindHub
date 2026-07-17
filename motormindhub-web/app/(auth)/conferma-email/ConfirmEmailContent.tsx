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
  // guardia la seconda chiamata arriverebbe con un token gia' consumato
  // dalla prima, mostrando un falso "link non valido".
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!token || hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    let cancelled = false;

    apiFetch(`/api/v1/utenti/verifica-email?token=${encodeURIComponent(token)}`, {
      skipAuth: true,
    })
      .then(async (response) => {
        if (cancelled) return;
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
        if (!cancelled) {
          setStatus("error");
          setMessage("Impossibile contattare il server. Riprova più tardi.");
        }
      });

    return () => {
      cancelled = true;
    };
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
