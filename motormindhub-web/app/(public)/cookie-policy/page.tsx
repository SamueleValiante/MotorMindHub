import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      ultimoAggiornamento="17/11/2026"
      sections={[
        {
          heading: "Cosa sono i cookie",
          body: "Piccoli file di testo che il sito salva sul tuo dispositivo per il corretto funzionamento e per migliorare l'esperienza di navigazione. Questa pagina elenca i cookie e le tecnologie simili che MotorMindHub usa davvero, e chi li gestisce. Il titolare del trattamento è indicato nell'Informativa Privacy.",
        },
        {
          heading: "Cookie tecnici (non richiedono consenso)",
          body: "Sono necessari al funzionamento del sito e si attivano senza consenso:",
          bullets: [
            "mmh_cookie_consent — salva la tua scelta sui cookie. Prima parte (questo sito), durata 12 mesi, accessibile da JavaScript.",
            "mmh_rt — mantiene attiva la sessione di accesso. Compare solo dopo il login. Prima parte (questo sito), non leggibile da JavaScript (httpOnly), inviato solo sullo stesso sito (SameSite Strict), scade dopo 3 ore di inattività (a ogni utilizzo la scadenza si rinnova); viene eliminato con l'uscita dall'account.",
          ],
        },
        {
          heading: "Cookie analitici (solo con il tuo consenso)",
          body: "Si attivano solo se premi \"Accetta tutti\" o li abiliti da \"Personalizza\". Servono a capire in forma aggregata come viene usato il sito:",
          bullets: [
            "mmh_visit_session — contiene un identificativo casuale di sessione che serve a contare le visite una sola volta per sessione. Impostato dal servizio applicativo del sito (api.motormindhub.com), non leggibile da JavaScript, scade alla chiusura del browser. Non contiene il tuo nome né la tua email.",
          ],
          more: [
            "Con il consenso agli analitici si attiva anche il monitoraggio degli errori tecnici di Sentry (server in Germania), che non usa cookie ma riceve informazioni sull'errore, sulla pagina, sul browser e sull'indirizzo IP. Senza il tuo consenso non parte alcuna richiesta verso Sentry.",
          ],
        },
        {
          heading: "Contenuti di terze parti",
          body: "Le immagini degli articoli e dei profili sono servite da Cloudinary (res.cloudinary.com). Il caricamento di un'immagine rivela il tuo indirizzo IP a Cloudinary, che per questo agisce come nostro fornitore. Non usiamo cookie pubblicitari né di profilazione e non incorporiamo social network o video di terzi.",
        },
        {
          heading: "Gestione delle preferenze",
          body: "Puoi accettare, rifiutare o personalizzare i cookie dal banner al primo accesso. Puoi cambiare idea in qualsiasi momento dal link \"Preferenze cookie\" nel footer: la revoca ha effetto immediato per le visite future. Rifiutare i cookie analitici non limita in alcun modo l'uso del sito. Puoi anche cancellare i cookie dalle impostazioni del tuo browser.",
        },
      ]}
    />
  );
}
