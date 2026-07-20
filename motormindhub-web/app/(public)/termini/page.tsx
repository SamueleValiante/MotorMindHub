import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function TerminiPage() {
  return (
    <LegalPageLayout
      title="Termini e Condizioni d'Uso"
      ultimoAggiornamento="01/07/2026"
      sections={[
        {
          heading: "1. Oggetto del servizio",
          body: "MotorMindHub è una piattaforma editoriale che fornisce contenuti tecnici e informativi in ambito automotive a scopo divulgativo.",
        },
        {
          heading: "2. Proprietà intellettuale",
          body: "Gli articoli pubblicati restano di proprietà dell'autore, che concede a MotorMindHub una licenza di pubblicazione non esclusiva.",
        },
        {
          heading: "3. Sospensione e cancellazione degli account",
          body: "MotorMindHub si riserva il diritto di sospendere o cancellare account che violino i presenti termini, secondo le procedure gestite dal Gestore Utenti.",
        },
        {
          heading: "4. Limitazione di responsabilità",
          body: "I contenuti hanno finalità informativa e non sostituiscono il parere di un tecnico qualificato.",
        },
      ]}
    />
  );
}
