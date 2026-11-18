import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function TerminiPage() {
  return (
    <LegalPageLayout
      title="Termini e Condizioni d'Uso"
      ultimoAggiornamento="17/11/2026"
      sections={[
        {
          heading: "1. Oggetto del servizio",
          body: "MotorMindHub è una piattaforma editoriale che fornisce contenuti tecnici e informativi in ambito automotive a scopo divulgativo, gestita come progetto indipendente da Samuele Valiante (Montano Antilia, SA). Leggere gli articoli non richiede un account; per salvare articoli, scrivere o moderare è necessario registrarsi.",
        },
        {
          heading: "2. Account",
          body: "Per registrarti devi avere almeno 14 anni e fornire dati veritieri. Sei responsabile di custodire le tue credenziali e di ciò che avviene con il tuo account: se sospetti un accesso non autorizzato, avvisaci a supporto@motormindhub.com. Il trattamento dei tuoi dati è descritto nell'Informativa Privacy.",
        },
        {
          heading: "3. Contenuti pubblicati dagli autori",
          body: "I ruoli di Autore si ottengono su invito della redazione. Gli articoli restano di proprietà dell'autore, che concede a MotorMindHub una licenza di pubblicazione non esclusiva, gratuita e per la durata della pubblicazione, per mostrarli e promuoverli sulla piattaforma.",
          more: [
            "L'autore è l'unico responsabile di ciò che scrive: dichiara che il contenuto è suo o che ha il diritto di usarlo, che le immagini e le fonti sono citate correttamente e che non viola diritti di terzi né la legge. Ogni articolo è revisionato prima della pubblicazione, ma la revisione non sostituisce la responsabilità dell'autore.",
          ],
        },
        {
          heading: "4. Uso accettabile",
          body: "Non è consentito pubblicare contenuti illeciti, offensivi, ingannevoli o che violino diritti altrui, tentare di accedere ad account o dati non tuoi, aggirare i sistemi di sicurezza, né usare il sito in modo automatizzato che ne comprometta il funzionamento.",
        },
        {
          heading: "5. Segnalazioni e rimozione di contenuti",
          body: "Puoi segnalare un profilo o un contenuto dal pulsante apposito, oppure scrivere a supporto@motormindhub.com. Se ritieni che un contenuto violi i tuoi diritti (per esempio di autore o di marchio) indicaci quale, dove si trova e perché: lo verifichiamo e, se necessario, lo correggiamo o lo rimuoviamo in tempi ragionevoli.",
        },
        {
          heading: "6. Sospensione e cancellazione degli account",
          body: "MotorMindHub può sospendere o cancellare account che violino questi termini, secondo le procedure gestite dal Gestore Utenti. Quando un account è sospeso ricevi un'email con il motivo. Se ritieni che la decisione sia sbagliata puoi contestarla scrivendo a supporto@motormindhub.com: la richiesta viene riesaminata da una persona e l'account può essere riattivato. Puoi cancellare il tuo account in qualsiasi momento dalla tua area personale.",
        },
        {
          heading: "7. Proprietà intellettuale e marchi",
          body: "Il sito, il suo design e il marchio MotorMindHub sono di proprietà del titolare. Marchi, nomi di modelli e loghi dei costruttori appartengono ai rispettivi titolari e sono citati a solo scopo informativo: MotorMindHub non è affiliato né sponsorizzato dai costruttori.",
        },
        {
          heading: "8. Limitazione di responsabilità",
          body: "I contenuti hanno finalità informativa e non sostituiscono il parere di un tecnico qualificato né la documentazione ufficiale del costruttore; per interventi su freni, sterzo, impianto elettrico e sistemi ad alta tensione rivolgiti a un'officina autorizzata. Il servizio è fornito \"così com'è\", senza garanzia di continuità o assenza di errori. Per quanto consentito dalla legge, il titolare non risponde di danni derivanti dall'uso delle informazioni pubblicate, salvo dolo o colpa grave, e restano ferme le tutele inderogabili previste per i consumatori.",
        },
        {
          heading: "9. Modifiche ai termini",
          body: "Possiamo aggiornare questi termini; la data in alto indica l'ultima versione. Per modifiche rilevanti ti avviseremo via email o sul sito. Se continui a usare il servizio dopo l'aggiornamento accetti la nuova versione; se non sei d'accordo puoi cancellare l'account.",
        },
        {
          heading: "10. Legge applicabile e foro competente",
          body: "Questi termini sono regolati dalla legge italiana. Se sei un consumatore resta competente il foro della tua residenza o del tuo domicilio; negli altri casi il foro competente è quello di Salerno.",
        },
      ]}
    />
  );
}
