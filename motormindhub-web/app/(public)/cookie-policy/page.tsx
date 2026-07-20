import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      ultimoAggiornamento="01/07/2026"
      sections={[
        {
          heading: "Cosa sono i cookie",
          body: "Piccoli file di testo che il sito salva sul tuo dispositivo per il corretto funzionamento e per migliorare l'esperienza di navigazione.",
        },
        {
          heading: "Cookie tecnici",
          body: "Necessari al funzionamento del sito (sessione, preferenze). Non richiedono consenso.",
        },
        {
          heading: "Cookie analitici e di profilazione",
          body: "Attivati solo previo consenso esplicito, utilizzati per comprendere l'utilizzo del sito in forma aggregata.",
        },
        {
          heading: "Gestione delle preferenze",
          body: "Puoi modificare le tue preferenze in qualsiasi momento dal link presente nel footer del sito.",
        },
      ]}
    />
  );
}
