import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function AccessibilitaPage() {
  return (
    <LegalPageLayout
      title="Dichiarazione di Accessibilità"
      ultimoAggiornamento="01/07/2026"
      sections={[
        {
          heading: "Stato di conformità",
          body: "MotorMindHub è conforme al livello AA delle Web Content Accessibility Guidelines (WCAG) 2.1.",
        },
        {
          heading: "Contenuti non accessibili",
          body: "Alcuni contenuti multimediali caricati dagli autori precedentemente al 2026 potrebbero non includere descrizioni alternative complete.",
        },
        {
          heading: "Segnalazioni",
          body: "Per segnalare barriere di accessibilità scrivi a accessibilita@motormindhub.it — risponderemo entro 5 giorni lavorativi.",
        },
      ]}
    />
  );
}
