import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function InformativaPrivacyPage() {
  return (
    <LegalPageLayout
      title="Informativa Privacy"
      ultimoAggiornamento="17/11/2026"
      sections={[
        {
          heading: "1. Titolare del trattamento",
          body: "Il titolare del trattamento (artt. 13 e 14 del Regolamento UE 2016/679, \"GDPR\") è Samuele Valiante, che gestisce MotorMindHub come progetto indipendente. Residenza: Montano Antilia (SA), Italia.",
          more: [
            "Per qualsiasi richiesta relativa ai tuoi dati personali puoi scrivere a supporto@motormindhub.com.",
          ],
        },
        {
          heading: "2. Quali dati trattiamo, perché e su quale base",
          body: "Trattiamo solo i dati necessari al servizio. Per ogni finalità indichiamo la base giuridica prevista dall'art. 6 GDPR.",
          bullets: [
            "Gestione dell'account (registrazione, accesso, profilo): nome, cognome, email, password (conservata solo in forma cifrata, non leggibile) e, solo se li inserisci, foto profilo e biografia. Base: esecuzione del contratto, cioè dei Termini che accetti registrandoti (art. 6.1.b).",
            "Comunicazioni di servizio (conferma email, recupero password, inviti, esito delle revisioni degli articoli, notifiche di moderazione): indirizzo email e dati dell'account. Base: esecuzione del contratto (art. 6.1.b). Non inviamo comunicazioni promozionali.",
            "Sicurezza e prevenzione degli abusi (limitazione dei tentativi di accesso, blocco temporaneo degli account, registri tecnici): dati di accesso e indirizzo IP. Base: legittimo interesse a proteggere la piattaforma e gli utenti (art. 6.1.f).",
            "Moderazione (segnalazioni su utenti e contenuti, sospensioni, cronologia delle azioni amministrative): dati dell'account, contenuto della segnalazione e decisione presa. Base: legittimo interesse a mantenere la community corretta e sicura (art. 6.1.f).",
            "Statistiche di visita aggregate: identificativo casuale di sessione, tipo di visitatore (ospite, iscritto, autore) e data della visita; conteggio delle letture degli articoli (articolo e data, senza il tuo nome). Base: consenso (art. 6.1.a), che puoi dare o revocare in qualsiasi momento dalle preferenze cookie.",
            "Monitoraggio degli errori tecnici del sito (Sentry): informazioni sull'errore, pagina visitata, browser e indirizzo IP. Si attiva solo se acconsenti ai cookie analitici. Base: consenso (art. 6.1.a).",
            "Adempimento di obblighi di legge e difesa di un diritto in giudizio. Base: art. 6.1.c e 6.1.f.",
          ],
        },
        {
          heading: "3. Dati pubblici degli autori",
          body: "Se sei un Autore, il tuo nome e cognome sono mostrati su ogni articolo che pubblichi e il tuo profilo pubblico (con foto e biografia, se inseriti) è visibile a tutti. Gli altri utenti registrati hanno un profilo visibile solo con i dati che scegli di rendere pubblici.",
        },
        {
          heading: "4. Obbligatorietà del conferimento",
          body: "Nome, cognome, email e password sono necessari per creare un account: senza questi dati non possiamo fornire il servizio. Foto, biografia e il consenso ai cookie analitici sono facoltativi; puoi navigare e leggere il sito anche senza account e senza dare consensi.",
        },
        {
          heading: "5. Destinatari e fornitori",
          body: "I dati sono trattati da fornitori che agiscono per nostro conto come responsabili del trattamento (art. 28 GDPR):",
          bullets: [
            "Vercel: hosting dell'interfaccia web.",
            "Railway: hosting del servizio applicativo e del database.",
            "Cloudinary: archiviazione e consegna delle immagini (foto profilo e copertine). Le immagini sono caricate direttamente dai server di Cloudinary: quando le visualizzi, il tuo indirizzo IP è visibile a Cloudinary.",
            "Postmark: invio delle email di servizio.",
            "Sentry: monitoraggio degli errori, solo con il tuo consenso agli analitici, su infrastruttura situata in Germania.",
          ],
          more: [
            "Non vendiamo i tuoi dati né li comunichiamo a terzi per finalità di marketing. Possono accedervi, nei limiti dei loro ruoli, il Manager Autori e il Gestore Utenti della piattaforma.",
          ],
        },
        {
          heading: "6. Trasferimenti fuori dallo Spazio Economico Europeo",
          body: "Alcuni dei fornitori elencati hanno sede o possono trattare dati negli Stati Uniti o in altri Paesi fuori dallo SEE. In questi casi il trasferimento avviene sulla base di una decisione di adeguatezza della Commissione europea (ad esempio il Data Privacy Framework UE-USA) o di clausole contrattuali standard. Non possiamo quindi garantire che tutti i dati restino sempre all'interno dell'Unione Europea. Puoi chiederci copia delle garanzie adottate scrivendo a supporto@motormindhub.com.",
        },
        {
          heading: "7. Per quanto tempo conserviamo i dati",
          body: "Conserviamo i dati dell'account finché l'account è attivo. In caso di richiesta di cancellazione, i dati personali vengono eliminati o anonimizzati in modo irreversibile entro 30 giorni dalla richiesta, con conferma via email. I registri tecnici contenenti dati personali non vengono conservati oltre 12 mesi. Le statistiche di visita non sono collegate al tuo nome. Possiamo conservare più a lungo solo i dati che la legge ci impone di mantenere o che servono a difenderci in giudizio.",
        },
        {
          heading: "8. I tuoi diritti",
          body: "Hai diritto di accedere ai tuoi dati, di rettificarli, di chiederne la cancellazione (\"diritto all'oblio\"), di limitarne il trattamento, di opporti ai trattamenti fondati sul legittimo interesse e di riceverli in un formato leggibile da dispositivo automatico (portabilità). Puoi esercitare accesso, rettifica, esportazione e cancellazione in autonomia dalla tua area personale, oppure scrivere a supporto@motormindhub.com.",
          more: [
            "Se il trattamento si basa sul consenso puoi revocarlo in qualsiasi momento, senza effetti sui trattamenti precedenti, dal link \"Preferenze cookie\" nel footer.",
            "Se ritieni che il trattamento violi la normativa puoi proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
          ],
        },
        {
          heading: "9. Età minima",
          body: "Il servizio non è destinato a persone con meno di 14 anni. Se scopriamo che un account è stato creato da un minore di 14 anni, lo chiudiamo e cancelliamo i relativi dati.",
        },
        {
          heading: "10. Decisioni automatizzate",
          body: "Non utilizziamo processi decisionali automatizzati né attività di profilazione che producano effetti su di te: le sospensioni e le moderazioni sono decise da persone.",
        },
        {
          heading: "11. Modifiche a questa informativa",
          body: "Se cambiamo il modo in cui trattiamo i dati aggiorniamo questa pagina e la data in alto. Per modifiche rilevanti ti avviseremo via email o sul sito.",
        },
      ]}
    />
  );
}
