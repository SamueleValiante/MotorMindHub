import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function InformativaPrivacyPage() {
  return (
    <LegalPageLayout
      title="Informativa Privacy"
      ultimoAggiornamento="01/07/2026"
      sections={[
        {
          heading: "1. Titolare del trattamento",
          body: "MotorMindHub è titolare del trattamento dei dati personali raccolti tramite la piattaforma. Per qualsiasi richiesta relativa al trattamento dei tuoi dati puoi scrivere a supporto@motormindhub.it.",
        },
        {
          heading: "2. Dati raccolti e finalità del trattamento",
          body: "Raccogliamo esclusivamente i dati necessari all'erogazione del servizio: dati anagrafici (nome, cognome, email) al momento della registrazione, e — solo se scegli di compilarli — foto profilo e biografia. Questi dati sono trattati per gestire il tuo account, erogare le funzionalità della piattaforma e inviarti comunicazioni di sistema. Nessun dato viene trattato per finalità ulteriori senza il tuo consenso esplicito.",
        },
        {
          heading: "3. Base giuridica",
          body: "Il trattamento si fonda sul consenso esplicito che presti al momento della registrazione, tramite la checkbox dedicata non pre-selezionata. La registrazione non può essere completata senza tale consenso.",
        },
        {
          heading: "4. I tuoi diritti",
          body: "Hai diritto di accedere in ogni momento ai dati personali che possediamo su di te, di rettificarli, di richiederne la cancellazione definitiva (\"diritto all'oblio\") e di esportarli in un formato leggibile da dispositivo automatico. Puoi esercitare questi diritti in autonomia dalla tua area personale, oppure scrivendo a supporto@motormindhub.it se preferisci un canale assistito.",
        },
        {
          heading: "5. Conservazione dei dati",
          body: "In caso di cancellazione dell'account, i dati personali vengono eliminati o anonimizzati in modo irreversibile entro 30 giorni dalla richiesta, con conferma via email. I log di sistema contenenti dati personali non vengono conservati oltre 12 mesi.",
        },
        {
          heading: "6. Fornitori terzi e localizzazione dei dati",
          body: "Alcuni trattamenti (es. archiviazione di immagini, invio di email transazionali) sono affidati a fornitori terzi, vincolati da un accordo sul trattamento dei dati. I tuoi dati personali sono archiviati ed elaborati su infrastrutture situate nel territorio dell'Unione Europea.",
        },
      ]}
    />
  );
}
