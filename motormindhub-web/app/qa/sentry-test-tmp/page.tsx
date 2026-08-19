"use client";

export default function SentryTestTmpPage() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("Errore di prova Sentry (client) — rimuovere dopo la verifica.");
      }}
    >
      Genera errore client
    </button>
  );
}
