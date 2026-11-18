import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function AccessibilitaPage() {
  return (
    <LegalPageLayout
      title="Dichiarazione di Accessibilità"
      ultimoAggiornamento="17/11/2026"
      sections={[
        {
          heading: "Stato di conformità",
          body: "MotorMindHub è progettato per rispettare il livello AA delle Web Content Accessibility Guidelines (WCAG) 2.1 ed è parzialmente conforme: si tratta di una valutazione interna, non di una certificazione di un ente terzo.",
          more: [
            "Verifichiamo l'accessibilità con controlli automatici (axe-core) e con prove di navigazione da tastiera sulle pagine principali e sulle aree riservate. Questi controlli non rilevano tutti i problemi: possono esistere barriere che non abbiamo ancora individuato.",
          ],
        },
        {
          heading: "Contenuti non accessibili",
          body: "Alcuni contenuti multimediali caricati dagli autori precedentemente al 2026 potrebbero non includere descrizioni alternative complete. Le immagini inserite dagli autori negli articoli possono avere descrizioni di qualità variabile.",
        },
        {
          heading: "Segnalazioni",
          body: "Per segnalare barriere di accessibilità o chiedere un contenuto in un formato alternativo scrivi a accessibilita@motormindhub.com — risponderemo entro 5 giorni lavorativi.",
        },
      ]}
    />
  );
}
