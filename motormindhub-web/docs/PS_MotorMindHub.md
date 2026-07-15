# MotorMindHub — Problem Statement (v1.5)

> Riferimento tecnico: dominio del problema, scenari, requisiti funzionali/non funzionali, ambiente di destinazione.

1. Problem Domain
La mobilità su gomma rappresenta oggi un pilastro fondamentale della società, coprendo qualsiasi 
esigenza: dagli spostamenti lavorativi alle commissioni quotidiane, fino al tempo libero. L'acquisto di 
un'automobile è un investimento significativo in cui la scelta ricade sul veicolo che meglio risponde alle 
specifiche esigenze dell'utente. Per molti, inoltre, il veicolo trascende la sua natura di mero assemblaggio 
meccanico o mezzo di trasporto, sviluppando una vera e propria componente affettiva e diventando un 
compagno di viaggio affidabile.
Data la crescente complessità ingegneristica dei veicoli odierni, è diventato essenziale promuovere una 
maggiore consapevolezza sul loro funzionamento e mantenimento. Il settore automotive, infatti, coinvolge 
un bacino d'utenza estremamente eterogeneo: si va dal guidatore occasionale che necessita di nozioni 
basilari (come la manutenzione ordinaria o l'orientamento tra i vari segmenti di mercato), fino 
all'appassionato alla ricerca di specifiche tecniche per l'upgrade dei componenti, passando per l'aspirante 
professionista meccatronico desideroso di ampliare il proprio know-how.
In questo contesto nasce MotorMindHub, un progetto concepito con l'obiettivo di centralizzare e divulgare 
la conoscenza tecnica e informativa legata all'ecosistema automobilistico. La piattaforma si propone come 
un hub accessibile e scalabile, ideato per accogliere sia il neofita che si affaccia per la prima volta a questo 
settore, sia l'esperto o il professionista alla ricerca di informazioni mirate e dettagliate.
Dal punto di vista strutturale, il progetto consiste in una piattaforma editoriale organizzata gerarchicamente
in moduli e sotto-moduli. L'architettura delle informazioni prevede una navigazione top-down, dalle 
categorie principali (es. Case automobilistiche, Storia del brand) ad approfondimenti di settore (es. 
Differenze tra le generazioni di un modello, motorizzazioni) fino a schede ad alta granularità (es. Specifiche 
tecniche di un singolo componente e guide all'acquisto). L'intero ecosistema si fonda sull'erogazione di 
articoli tecnici e guide tematiche.
Il sistema prevede la profilazione di diversi attori, ciascuno dotato di specifici permessi e di un'interfaccia 
dedicata:
Utente Visitatore (Guest) e Utente Registrato che attualmente condividono le medesime logiche di 
interazione lato front-end tranne alcuni aspetti. Possono navigare nel portale, effettuare ricerche all'interno
del database di articoli e, per l'utente iscritto, utilizzare funzioni di bookmarking per salvare i contenuti nei 
"Preferiti" o in una lista "Leggi più tardi", oltre a segnalare contenuti o profili non conformi ai termini di 
servizio.
Autore che ha accesso a un'area riservata dedicata alla stesura, modifica e gestione dei propri articoli, oltre 
che all'assegnazione delle categorie di competenza.
Manager degli Autori, la figura di coordinamento editoriale dotata di privilegi avanzati, responsabile della 
supervisione operativa, della moderazione dei contenuti e della gestione degli account degli Autori.
Gestore Utenti, una figura amministrativa distinta dal Manager degli Autori e con ambito di competenza 
complementare: mentre il Manager degli Autori sovrintende alla filiera editoriale (autori e articoli), il 
Gestore Utenti è responsabile della gestione della base di utenza (Guest e Iscritti), della moderazione degli 
account, della gestione delle segnalazioni ricevute dalla community e dell'evasione delle richieste relative 
all'esercizio dei diritti previsti dal GDPR (accesso, rettifica, cancellazione, portabilità). Questa separazione 
dei ruoli riflette il principio di segregazione delle responsabilità ("separation of duties") e consente una 
gestione più efficiente e specializzata via via che la community cresce.

2. Scenari Principali
2.1 Registrazione e autenticazione
Marco è un grande appassionato di motori e, dopo aver letto vari articoli su MotorMindHub come utente 
guest, decide di creare un account per salvare i contenuti.
Raggiunge la home page del sito e fa click sul bottone “Registrati” in alto. Viene rediretto a un form dove 
inserisce: foto profilo (opzionale), nome “Marco”, cognome “Verdi”, la sua email “marcoverdi@provider.it”,
biografia (opzionale) e una password sicura, per poi fare click su “Crea account”. Il sistema gli mostra un 
messaggio di successo e invia un'email di verifica all'indirizzo fornito.
Marco apre la mail e clicca sul link di conferma, attivando così il proprio account. Torna quindi all'home 
page, fa click su “Accedi”, inserisce le credenziali appena create e fa click su “Login”. Viene indirizzato alla 
sua nuova area personale, pronto per esplorare la piattaforma.
2.2 Modifica password dimenticata
Marco cerca di accedere a MotorMindHub dal suo nuovo tablet, ma non ricorda la password impostata 
durante la registrazione. Dalla pagina di login, fa click sul link “Hai dimenticato la password?”.
Viene rediretto a una nuova pagina dove inserisce l'indirizzo email associato al suo account e fa click su 
“Invia link di recupero”. Poco dopo, riceve un'email contenente un link sicuro e a tempo. Cliccandolo, viene 
indirizzato a una pagina del sito dove può digitare e confermare una nuova password.
Cliccando su “Reimposta password”, a schermo gli compare una notifica verde che lo avvisa dell'avvenuto 
cambio, e viene reindirizzato alla schermata di login per accedere.
2.3 Modifica dati utente
Marco, dopo aver effettuato il login alla sua area personale, decide di inserire una sua foto profilo.
Fa click sulla voce “Impostazioni profilo” e viene rediretto a una pagina con i suoi dati attuali. Qui decide di 
caricare una foto della sua auto come immagine di profilo e aggiorna il campo “Biografia” scrivendo della 
sua passione per i motori aspirati. Una volta completato l'inserimento, fa click sul bottone “Salva 
modifiche”.
Un popup a comparsa lo avvisa che i dati sono stati aggiornati correttamente.
2.4 Ricerca articolo per filtro
Marco ha bisogno di capire come effettuare la manutenzione dei freni della sua auto. Raggiunge l'home 
page di MotorMindHub e si reca nella sezione “Esplora articoli”. Sulla sinistra dello schermo trova un 
pannello dedicato ai filtri di ricerca: dal menù a tendina “Categoria” seleziona “Manutenzione ordinaria” e, 
sotto la voce “Componentistica”, spunta la casella “Impianto Frenante”. Infine, fa click sul bottone “Applica 
filtri”.
La pagina si aggiorna immediatamente mostrandogli solo le card degli articoli tecnici pertinenti alla sua 
ricerca, facilitando la sua scelta.
2.5 Salvataggio articolo nei preferiti / Leggere più tardi
Mentre Marco (essendo loggato) naviga tra i risultati filtrati, trova un articolo molto interessante intitolato 
“Differenza tra dischi freno forati e baffati”. Inizia a leggerlo, ma si accorge che sta facendo tardi per andare
al lavoro.

Per non perdere la pagina, sposta il cursore in alto a destra vicino al titolo dell'articolo e fa click sull'icona a 
forma di segnalibro. Dal piccolo menù a tendina che compare, seleziona “Aggiungi a Leggi più tardi”. Una 
notifica a comparsa in basso a sinistra dello schermo gli conferma che l'articolo è stato salvato con successo
nella sua lista personale.
2.6 Rimozione articolo nei preferiti / Leggere più tardi
La sera, rientrato a casa, Marco effettua il login, apre la sidebar sinistra della sua area personale e fa click 
sulla voce “I miei salvataggi”.
Viene rediretto a una pagina contenente le card di tutti gli articoli salvati in precedenza. Clicca sulla card 
dell'articolo sui dischi freno e, dopo averlo letto per intero, decide che non ha più bisogno di tenerlo 
memorizzato.
Fa click nuovamente sull'icona del segnalibro (che ora risulta colorata) e seleziona “Rimuovi dai salvati”. La 
pagina si aggiorna automaticamente e l'articolo scompare dalla sua lista.
2.7 Autenticazione Manager autori
Alessandro è l'amministratore e Manager degli autori di MotorMindHub. Per iniziare il suo turno di 
revisione, raggiunge la pagina di login e inserisce le sue credenziali amministrative, facendo poi click su 
“Accedi”.
Il sistema riconosce il suo ruolo speciale e, a differenza di un normale utente, lo reindirizza direttamente 
alla “Dashboard Manageriale”, un'interfaccia complessa contenente grafici sulle visite, la lista degli articoli 
in attesa di approvazione e i pannelli di gestione del team.
2.8 Aggiunta autore
Dalla sua Dashboard Manageriale, Alessandro decide di invitare Giulia, un'esperta meccatronica, a scrivere 
per il portale.
Dalla sidebar di sinistra fa click su “Gestione Autori” e viene rediretto alla pagina con la lista dell'attuale 
team. Fa click in alto a destra sul bottone “Nuovo Autore”. Si apre un form dove Alessandro inserisce nome,
cognome, email di Giulia e il ruolo “Autore”.
Dopo aver fatto click su “Invia invito”, il sistema gli mostra una notifica di conferma e invia 
automaticamente un'email a Giulia per completare la registrazione al portale in veste di autrice.
2.9 Accettazione richiesta di diventare autore
Giulia riceve una email dalla gestione autori di MotorMindHub, la apre e vede che, come accordato in 
precedenza con il manager degli autori, è un invito a diventare autore. Giulia, entusiasta, clicca sul link che 
la porta a fare l'accesso al sito, dopodiché clicca “Accetta” e le viene mostrata una notifica di successo.
Le arriva una mail con le credenziali da autore, relative a un account distinto dal suo attuale profilo utente. 
La mail viene inviata anche al manager degli autori, che viene messo al corrente dell'accettazione. Nel 
sistema viene registrato questo nuovo autore.
2.10 Rifiuto richiesta di diventare autore
Giulia riceve una email dalla gestione autori di MotorMindHub, la apre e vede che, come accordato in 
precedenza con il manager degli autori, è un invito a diventare autore. Giulia, avendoci ripensato, clicca sul 
link che la porta a fare l'accesso al sito, dopodiché clicca “Rifiuta” e le viene mostrata una notifica di 
successo.
Le arriva una mail che la informa di aver rifiutato l'incarico. La mail viene inviata anche al manager degli 

autori, che viene messo al corrente di ciò.
2.11 Rimozione autore
Alessandro, controllando le statistiche nella pagina “Gestione Autori”, nota che l'autore Roberto non 
pubblica articoli da oltre due anni e decide di revocargli i permessi per mantenere il database pulito.
Cerca il nome di Roberto nella barra di ricerca della tabella e, una volta trovato, fa click sull'icona dei tre 
puntini posta alla fine della riga corrispondente. Dal menù a tendina seleziona “Rimuovi Autore”. Il sistema 
apre un pop-up di avviso chiedendogli di confermare la scelta e se desidera mantenere o eliminare gli 
articoli scritti in passato da Roberto. Alessandro sceglie di mantenerli e clicca su “Conferma rimozione”.
2.12 Creazione categoria
Giulia, la nuova autrice, vuole scrivere una serie di articoli sui veicoli a idrogeno, ma si accorge che non 
esiste una sezione dedicata.
Dalla sua interfaccia autore fa click sulla voce “Categorie” e poi sul bottone “Crea nuova categoria”. Viene 
reindirizzata a un form dove inserisce il nome “Auto a Idrogeno”, seleziona “Alimentazioni Alternative” 
come categoria padre e inserisce una breve descrizione.
Facendo click su “Salva categoria”, il sistema aggiorna l'albero di navigazione del sito, rendendo il nuovo 
argomento subito disponibile per i futuri articoli.
2.13 Rimozione categoria
Durante una riorganizzazione dei contenuti, Alessandro si accorge che le categorie “Motori Termici” e 
“Propulsori a Combustione” sono praticamente dei duplicati.
Dalla sidebar della sua Dashboard, clicca su “Gestione Categorie”. Trova “Propulsori a Combustione” nella 
lista, clicca sull'icona a forma di cestino rossa a lato e, nel pop-up modale che appare, il sistema gli chiede a 
quale altra categoria assegnare gli articoli orfani.
Seleziona “Motori Termici” dal menù a tendina e fa click su “Elimina definitivamente”.
2.14 Modifica categoria
Giulia sta controllando la pagina della categoria “Pneumatici e Cerchi” e nota un errore grammaticale nella 
descrizione visualizzata dagli utenti.
Dalla sua area riservata va su “Categorie”, cerca quella in questione e fa click sull'icona della matita 
(“Modifica”). Viene rediretta alla pagina di configurazione, corregge il refuso nel box di testo della 
descrizione e fa click sul bottone verde “Aggiorna categoria”.
Una notifica le conferma che la modifica è già visibile online per tutti i lettori.
2.15 Creazione articolo
Giulia ha preparato un pezzo su come misurare la pressione delle gomme e vuole pubblicarlo.
Dalla sua area autrice fa click su “I miei articoli” e poi sul pulsante “Scrivi nuovo articolo”. Si apre un editor 
di testo avanzato dove inserisce il titolo, copia e incolla il testo del suo pezzo, e usa la barra laterale per 
caricare un'immagine di copertina esplicativa. Sempre dalla barra laterale spunta la categoria 
“Manutenzione ordinaria” e aggiunge dei tag rilevanti.
Soddisfatta del risultato, fa click su “Pubblica articolo” e il pezzo va a finire nella lista degli articoli in attesa 
di approvazione del manager degli autori.

2.16 Salvataggio articolo come bozza
Giulia sta scrivendo un articolo chiamato “Candele adatte per Ape50” ma nota che tra 10 minuti deve 
prendere l'autobus e non ha tempo per ultimarlo. Nell'editor di testo dedicato in cui si trova, scorre fino in 
fondo e clicca il pulsante “Salva bozza”.
Le viene mostrata una notifica a schermo del successo della sua operazione e l'articolo viene salvato nella 
sezione “Le mie bozze”, a cui può accedere dalla sua area autore.
2.17 Ripresa bozza e pubblicazione
Dopo essere arrivata a lavoro, Giulia ricorda di aver lasciato in sospeso l'articolo “Candele adatte per 
Ape50” come bozza. Naviga nella sezione “Le mie bozze” dalla sua area autore e trova la card della sua 
bozza. Cliccandoci sopra, si apre l'editor di testo esattamente al punto in cui aveva salvato la bozza.
Dopo averla ultimata, procede con la pubblicazione cliccando sul pulsante in fondo “Pubblica articolo” e il 
pezzo va a finire nella lista degli articoli in attesa di approvazione del manager degli autori.
2.18 Cancellazione bozza
Giulia sta scorrendo tra le sue bozze e si rende conto che un articolo intitolato “Test marmitte 2021” è 
ormai obsoleto prima ancora di essere ultimato.
Naviga nella sezione “Le mie bozze” e individua la card del documento. Fa click sui tre puntini nell'angolo 
della card, seleziona “Elimina” e conferma la sua decisione nel pop-up a comparsa cliccando su “Sì, 
rimuovi”. L'articolo viene cancellato definitivamente dal server.
2.19 Rimozione articolo
Giulia sta scorrendo tra i suoi articoli e si rende conto che un articolo intitolato “Test pneumatici 2023” è 
ormai obsoleto.
Naviga nella sezione “I miei articoli”, individua la card del documento. Fa click sui tre puntini nell'angolo 
della card, seleziona “Elimina” e conferma la sua decisione nel pop-up a comparsa cliccando su “Sì, 
rimuovi”. L'articolo viene cancellato definitivamente dal server.
2.20 Modifica articolo
Poche ore dopo aver pubblicato il pezzo sulla pressione delle gomme, Giulia rilegge il testo e si accorge di 
aver invertito i valori dei bar consigliati tra asse anteriore e posteriore. Entra tempestivamente nella sua 
interfaccia autrice, va su “I miei articoli” e cerca il pezzo pubblicato.
Fa click sul bottone “Modifica” accanto al titolo, viene reindirizzata all'editor di testo dove va a correggere 
immediatamente i valori numerici. Infine, fa click su “Aggiorna articolo”. Un avviso a comparsa le conferma 
che i cambiamenti sono stati salvati e i lettori vedranno ora la versione corretta.
2.21 Autenticazione Gestore Utenti
Elena è la Gestore Utenti di MotorMindHub, la figura amministrativa incaricata della supervisione della 
community e degli account degli iscritti. Per iniziare la sua giornata di lavoro, raggiunge la pagina di login e 
inserisce le proprie credenziali amministrative, facendo poi click su “Accedi”.
Il sistema riconosce il suo ruolo e la reindirizza alla “Dashboard Gestione Utenti”, un'interfaccia distinta da 
quella del Manager degli Autori, contenente il numero di utenti registrati, le segnalazioni aperte, e le 
richieste GDPR in attesa di lavorazione.

2.22 Sospensione di un utente per violazione dei termini di servizio
Elena, controllando la coda delle segnalazioni, nota che l'utente “Paolo88” è stato segnalato più volte da 
altri iscritti per aver caricato, come immagine di profilo, contenuti non pertinenti e offensivi.
Dalla “Dashboard Gestione Utenti” fa click su “Gestione Account” e cerca “Paolo88” nella barra di ricerca 
della tabella utenti. Apre la scheda del profilo, verifica lo storico delle segnalazioni allegate e fa click sul 
bottone “Sospendi account”.
Nel pop-up che compare, seleziona la motivazione “Violazione dei Termini di Servizio – contenuti 
inappropriati”, imposta una sospensione temporanea di 30 giorni e conferma con “Conferma sospensione”.
Il sistema disattiva temporaneamente l'accesso dell'account e invia una email a Paolo con la motivazione 
del provvedimento e le modalità per presentare ricorso.
2.23 Riattivazione di un utente sospeso
Paolo, ricevuta la comunicazione, rimuove l'immagine incriminata e scrive a MotorMindHub per chiedere la
riattivazione anticipata del proprio account, allegando le proprie scuse.
Elena riceve la richiesta nella sezione “Ricorsi” della Dashboard, apre la scheda dell'utente e verifica che il 
profilo sia stato effettivamente corretto. Fa click su “Riattiva account”, il sistema le chiede conferma tramite
un pop-up e Elena conferma cliccando su “Conferma riattivazione”.
L'accesso di Paolo viene ripristinato immediatamente e una email automatica lo informa dell'avvenuta 
riattivazione.
2.24 Gestione di una richiesta di cancellazione account (diritto all'oblio)
Sara, un'utente iscritta, decide di non voler più utilizzare la piattaforma e, dalla propria area personale, fa 
click su “Elimina il mio account” nella sezione “Impostazioni profilo”, confermando la scelta.
La richiesta viene inserita automaticamente nella coda “Richieste di cancellazione” della Dashboard di 
Elena. Elena verifica che non vi siano contenuti in sospeso legati all'account (es. articoli in corso di 
revisione, se l'utente fosse anche autore) e conferma l'elaborazione della richiesta con un click su “Procedi 
con la cancellazione”.
Il sistema elimina o anonimizza irreversibilmente i dati personali di Sara entro i termini di legge e invia 
automaticamente un'email di conferma dell'avvenuta cancellazione, sia a Sara sia in copia interna a Elena 
per la tracciabilità dell'operazione.
2.25 Gestione di una segnalazione tra utenti
Un utente iscritto segnala, tramite l'apposita icona presente sul profilo pubblico, un altro iscritto che ritiene
stia utilizzando un nome utente offensivo. La segnalazione compare nella “Coda Segnalazioni” della 
Dashboard di Elena, corredata da motivazione e screenshot allegato.
Elena apre la segnalazione, esamina il profilo indicato e valuta che la segnalazione sia fondata. Fa click su 
“Richiedi modifica” e invia una comunicazione automatica all'utente, chiedendogli di modificare il proprio 
nome utente entro 7 giorni, pena la sospensione temporanea dell'account. Elena archivia la segnalazione 
come “In gestione”, che rimarrà tracciata nella cronologia fino alla risoluzione.
2.26 Esportazione assistita dei dati personali (portabilità)
Un utente iscritto contatta il supporto perché, a causa di un problema tecnico con il proprio browser, non 
riesce a utilizzare la funzione di autoesportazione dei dati presente nelle impostazioni del profilo.
Elena, dopo aver verificato l'identità del richiedente tramite l'indirizzo email registrato, accede dalla 

Dashboard alla scheda dell'utente e fa click su “Esporta dati utente”. Il sistema genera un file in formato 
JSON contenente i dati anagrafici, la lista degli articoli salvati e, se applicabile, lo storico editoriale, e lo invia
in automatico all'indirizzo email verificato dell'utente tramite un link di download sicuro e a scadenza.

3. Requisiti Funzionali
3.1 Funzionalità Utente guest e iscritto
Gli Utenti Guest (visitatori non autenticati) e gli Utenti Iscritti condividono le funzionalità di base per la 
fruizione dei contenuti. L'iscrizione sblocca funzionalità aggiuntive di interazione e salvataggio.
RF1.1: Il sistema deve permettere a tutti gli utenti (guest e iscritti) di navigare nel portale e leggere gli 
articoli tecnici e le guide.
RF1.2: Il sistema deve fornire un motore di ricerca e filtri combinati (es. per “Categoria” e relative 
sottocategorie come “Componentistica”) per individuare articoli specifici.
RF1.3: Il sistema deve permettere ai visitatori di creare un account fornendo nome, cognome, email, 
password sicura, e opzionalmente una foto profilo e una biografia. La registrazione richiede la verifica 
dell'indirizzo email prima dell'attivazione dell'account.
RF1.4: Il sistema deve permettere all'utente registrato di effettuare il login tramite le proprie credenziali 
(email e password).
RF1.5: Il sistema deve inviare un link sicuro via email per permettere all'utente di reimpostare la password 
in caso di smarrimento.
RF1.6: Il sistema deve permettere all'utente di aggiornare i propri dati personali, inclusi il caricamento di 
una foto profilo e la modifica della biografia.
RF1.7: Il sistema deve permettere all'utente di salvare gli articoli in liste personali (“Preferiti” o “Leggi più 
tardi”) e di rimuoverli quando non più necessari.
RF1.8: Il sistema deve fornire una sezione dedicata (“I miei salvataggi”) dove l'utente può visualizzare e 
accedere rapidamente alle card di tutti gli articoli salvati.
RF1.9: Il sistema deve permettere a un utente registrato di segnalare un profilo di un altro utente ritenuto 
non conforme ai Termini di Servizio, indicando una motivazione. La segnalazione deve essere inoltrata alla 
coda di lavorazione del Gestore Utenti.
RF1.10: Il sistema deve permettere all'utente registrato di richiedere, dalla propria area personale, 
l'esportazione dei propri dati personali in formato strutturato (es. JSON) e la cancellazione definitiva del 
proprio account.
3.2 Funzionalità autore
L'Autore è un content creator con accesso a un'area riservata per la gestione dei propri contenuti editoriali.
RF2.1: Il sistema deve fornire un'interfaccia dedicata (“Dashboard Autore”) accessibile post-login.
RF2.2: Il sistema deve disporre di un editor di testo avanzato che consenta all'autore di inserire titolo, testo,
immagine di copertina, tag e assegnare la categoria di competenza. Al salvataggio, l'articolo deve passare in
stato di “attesa di approvazione”.
RF2.3: Il sistema deve permettere all'autore di correggere e aggiornare i propri articoli già pubblicati, 
rendendo le modifiche immediatamente visibili ai lettori.
RF2.4: Il sistema deve permettere all'autore di eliminare definitivamente gli articoli non ancora pubblicati 
(in stato di bozza) e gli articoli già pubblicati.
RF2.5: Il sistema deve consentire all'autore di creare nuove categorie per l'albero di navigazione, 
specificando nome, categoria padre e descrizione.
RF2.6: Il sistema deve permettere all'autore di modificare il testo descrittivo delle categorie esistenti.

RF2.7: Il sistema deve permettere ad ogni autore di gestire (salvare, riprendere, modificare, rimuovere) le 
bozze dei propri articoli.
3.3 Funzionalità Manager Autori
Il Manager degli Autori è un amministratore con privilegi avanzati per il coordinamento del team editoriale 
e la moderazione dei contenuti; possiede le stesse funzionalità di un autore, più le seguenti.
RF3.1: Al login, il sistema deve reindirizzare il Manager a un'interfaccia esclusiva contenente statistiche (es. 
grafici sulle visite), lista di articoli da approvare e strumenti di gestione del team editoriale.
RF3.2: Il sistema deve permettere al Manager di visualizzare la lista completa degli autori attuali.
RF3.3: Il sistema deve consentire al Manager di aggiungere nuovi membri specificando nome, cognome, 
email e ruolo, generando l'invio automatico di un'email di invito per la registrazione.
RF3.4: Il sistema deve permettere la revoca dei permessi a un autore esistente, offrendo al Manager 
l'opzione di eliminare o mantenere sul portale gli articoli redatti in passato dall'utente rimosso.
RF3.5: Il sistema deve permettere al Manager di eliminare categorie obsolete o duplicate. Durante 
l'eliminazione, il sistema deve obbligare il Manager a selezionare una nuova categoria a cui riassegnare 
eventuali articoli “orfani”.
RF3.6: Dopo che un autore ha scritto un articolo, questo deve essere accettato dal Manager se ritenuto 
idoneo alla pubblicazione, oppure rifiutato, con possibilità di indicare una motivazione all'autore.
3.4 Funzionalità Gestore Utenti
Il Gestore Utenti è una figura amministrativa, distinta e indipendente dal Manager degli Autori, 
responsabile della gestione della base di utenza (Guest e Iscritti), della moderazione degli account e 
dell'evasione delle richieste relative ai diritti GDPR. La separazione dei permessi tra questo ruolo e quello 
del Manager degli Autori riduce la superficie di rischio e consente una moderazione più mirata.
RF4.1: Al login, il sistema deve reindirizzare il Gestore Utenti a una “Dashboard Gestione Utenti” esclusiva, 
distinta da quella del Manager Autori, contenente il numero di utenti registrati, le segnalazioni aperte e le 
richieste GDPR in coda.
RF4.2: Il sistema deve permettere al Gestore Utenti di ricercare, filtrare e visualizzare la lista completa degli 
utenti registrati (guest esclusi, in quanto non tracciati) con i relativi dettagli e stato dell'account (attivo, 
sospeso, in cancellazione).
RF4.3: Il sistema deve permettere al Gestore Utenti di sospendere un account utente per violazione dei 
Termini di Servizio, specificando una motivazione e una durata (temporanea o permanente). Il sistema deve
notificare via email l'utente coinvolto, indicando la motivazione e le modalità di ricorso.
RF4.4: Il sistema deve permettere al Gestore Utenti di riattivare un account precedentemente sospeso, 
previa verifica delle condizioni di riammissione, con conferma esplicita e notifica automatica all'utente.
RF4.5: Il sistema deve fornire al Gestore Utenti una coda di lavorazione delle segnalazioni ricevute dagli 
utenti (su profili o comportamenti scorretti), permettendo di visionarle, contattare l'utente segnalato, 
archiviarle o scalarle a sospensione.
RF4.6: Il sistema deve fornire al Gestore Utenti una coda dedicata alle richieste di cancellazione 
dell'account (diritto all'oblio), permettendo di verificarne i prerequisiti (es. assenza di contenuti editoriali in 
sospeso) e di confermarne l'elaborazione entro i termini di legge.
RF4.7: Il sistema deve permettere al Gestore Utenti, previa verifica dell'identità del richiedente, di generare
ed inviare su richiesta assistita l'esportazione dei dati personali di un utente in un formato strutturato e 
leggibile da dispositivo automatico.

RF4.8: Il sistema deve mantenere una cronologia consultabile dal Gestore Utenti di tutte le azioni 
amministrative compiute sugli account (sospensioni, riattivazioni, cancellazioni, esportazioni), ai fini di 
tracciabilità e accountability.

4. Requisiti Non Funzionali
4.1 Usabilità
RNF1.1: L'interfaccia utente deve adattarsi automaticamente e in modo fluido a qualsiasi risoluzione e 
dispositivo (desktop, tablet, smartphone), garantendo una lettura e una navigazione ottimali ovunque.
RNF1.2: I flussi di interazione (dalla registrazione utente alla stesura articoli nella dashboard autori, fino alla
gestione account nella dashboard del Gestore Utenti) devono richiedere il minor numero di click possibile, 
fornendo sempre feedback visivi chiari (es. notifiche a comparsa per salvataggi o errori).
4.2 Affidabilità
RNF2.1: Il sistema deve garantire una disponibilità minima del 99,9% su base annua, assicurando che l'hub 
di informazioni sia costantemente accessibile al pubblico.
RNF2.2: Tutti i dati sensibili degli utenti (come email e password) devono essere crittografati utilizzando 
algoritmi di hashing moderni (nel nostro caso Bcrypt).
RNF2.3: Tutte le comunicazioni client-server devono avvenire tramite protocollo crittografato HTTPS.
RNF2.4: I dati devono essere protetti contro SQL injection e il sito da attacchi DoS e Cross-Site Scripting 
(XSS).
RNF2.5: Il sistema deve prevedere un meccanismo di backup automatico e incrementale giornaliero del 
database e degli asset multimediali, garantendo un ripristino rapido in caso di anomalie dei server.
RNF2.6: Devono essere previste misure contro attacchi di bruteforce: dopo n tentativi non andati a buon 
fine di login, l'account sarà bloccato temporaneamente e sarà richiesta la conferma dello sblocco tramite 
email.
RNF2.7: Per l'autenticazione e la comunicazione tra client e server viene utilizzato JWT, che consente di 
mantenere la sicurezza tra i due endpoint durante la sessione. Il token generato ha una durata limitata 
nella sessione e dovrà essere rigenerato periodicamente (vedi RNF9.2).
4.3 Prestazioni
RNF3.1: Le pagine destinate al pubblico (Home, visualizzazione articoli) devono essere renderizzate e 
risultare interattive in meno di 2-3 secondi su reti 4G standard.
RNF3.2: Il motore di ricerca interno e l'applicazione dei filtri per categoria devono restituire i risultati in 
tempo reale (tempi di latenza inferiori a 500 millisecondi).
RNF3.3: Il back-end deve essere in grado di gestire centinaia di utenti connessi simultaneamente senza 
mostrare evidenti rallentamenti o colli di bottiglia, predisponendo un'architettura scalabile in caso di picchi 
di traffico.
4.4 Manutenzione
RNF4.1: Il codice sorgente deve seguire i principi della programmazione object-oriented e pattern 
architetturali (es. MVC) con una netta separazione delle responsabilità tra Front-End, Back-End e Database.
RNF4.2: Devono essere prodotti e mantenuti aggiornati manuali tecnici del codice e la documentazione 
Swagger per le API, al fine di facilitare l'onboarding di nuovi sviluppatori e i futuri upgrade.
RNF4.3: Il server deve registrare le eccezioni e gli errori critici in file di log protetti, consentendo agli 
amministratori tecnici di effettuare un debugging rapido e mirato.

4.5 Protezione dei Dati Personali (GDPR — Reg. UE 2016/679)
RNF5.1: Consenso esplicito alla registrazione. Durante il processo di registrazione, il sistema deve 
presentare all'utente un'informativa privacy chiara e leggibile (redatta ai sensi dell'Art. 13 GDPR) e 
raccogliere il consenso esplicito tramite checkbox non pre-selezionata. La registrazione non può essere 
completata senza tale consenso.
RNF5.2: Finalità del trattamento. Il sistema deve trattare i dati personali degli utenti esclusivamente per le 
finalità dichiarate nell'informativa (erogazione del servizio, comunicazioni di sistema). È vietato qualsiasi 
trattamento ulteriore non espressamente consentito dall'utente.
RNF5.3: Diritto di accesso ai propri dati (Art. 15 GDPR). Il sistema deve consentire all'utente registrato di 
visualizzare, dalla propria area personale, tutti i dati personali in suo possesso registrati dal sistema (nome, 
cognome, email, foto profilo, biografia, articoli salvati).
RNF5.4: Diritto di rettifica (Art. 16 GDPR). Il sistema deve consentire all'utente di modificare in autonomia i 
propri dati personali in qualsiasi momento, senza necessità di contattare un amministratore (cfr. RF1.6), 
garantendo tale possibilità per tutti i campi sensibili.
RNF5.5: Diritto alla cancellazione (Art. 17 GDPR — “Diritto all'oblio”). Il sistema deve consentire all'utente 
registrato di richiedere, in autonomia dalla propria area personale, la cancellazione definitiva del proprio 
account e di tutti i dati personali associati (cfr. RF1.10). Qualora la richiesta pervenga tramite canali 
alternativi (es. email di supporto), la richiesta deve poter essere elaborata manualmente dal Gestore Utenti
(cfr. RF4.6). In entrambi i casi, il sistema deve eliminare o anonimizzare irreversibilmente tutti i dati entro 
30 giorni dalla richiesta e inviare una conferma via email dell'avvenuta cancellazione.
RNF5.6: Diritto alla portabilità dei dati (Art. 20 GDPR). Il sistema deve consentire all'utente di esportare 
autonomamente i propri dati personali in un formato strutturato, di uso comune e leggibile da dispositivo 
automatico (es. JSON o CSV), includendo almeno: dati anagrafici, lista articoli salvati e storico attività 
editoriale per gli autori. In caso di impossibilità tecnica per l'utente, il Gestore Utenti può generare ed 
inviare l'esportazione su richiesta assistita, previa verifica dell'identità (cfr. RF4.7).
RNF5.7: Diritto di opposizione e revoca del consenso (Art. 21 GDPR). Il sistema deve consentire all'utente di 
revocare in qualsiasi momento i consensi precedentemente forniti (es. ricezione email di marketing, se 
introdotte in futuro) con la stessa semplicità con cui sono stati concessi, senza che ciò pregiudichi la 
fruizione del servizio principale.
RNF5.8: Data retention e policy di conservazione. Il sistema deve definire e applicare una policy di 
conservazione dei dati. In particolare: i dati di un utente cancellato devono essere eliminati entro 30 giorni; 
i dati di un autore rimosso dal Manager, o di un utente la cui rimozione è gestita dal Gestore Utenti, devono
essere anonimizzati (gli eventuali contenuti mantenuti non devono essere più riconducibili alla persona 
fisica); i log di sistema contenenti dati personali non devono essere conservati per più di 12 mesi.
RNF5.9: Minimizzazione dei dati (Art. 5 GDPR). Il sistema deve raccogliere esclusivamente i dati personali 
strettamente necessari all'erogazione del servizio. I campi opzionali (foto profilo, biografia) devono essere 
chiaramente indicati come tali e la loro mancata compilazione non deve pregiudicare l'accesso alle 
funzionalità principali.
RNF5.10: Notifica delle violazioni (Art. 33-34 GDPR). Il sistema deve prevedere un meccanismo 
documentato per la rilevazione e la gestione delle violazioni dei dati personali (Data Breach), di cui il 
Gestore Utenti è referente operativo per l'ambito relativo agli account utente. In caso di violazione, il 
titolare del trattamento deve essere in grado di notificare il Garante Privacy entro 72 ore dalla scoperta e, 
se la violazione presenta rischi elevati per gli interessati, notificare anche gli utenti coinvolti senza 
ingiustificato ritardo.
RNF5.11: Registro delle attività di trattamento (Art. 30 GDPR). La piattaforma deve essere accompagnata da
un Registro delle Attività di Trattamento redatto e mantenuto aggiornato dal titolare del trattamento, 
documentando finalità, categorie di dati trattati, misure di sicurezza adottate e tempi di conservazione.

RNF5.12: Designazione del Responsabile del trattamento. Nel caso in cui servizi di terze parti trattino dati 
personali degli utenti per conto della piattaforma (es. AWS S3/Cloudinary per le immagini, servizi email per 
il recupero password), deve essere stipulato un Data Processing Agreement (DPA) con ciascun fornitore, ai 
sensi dell'Art. 28 GDPR.
RNF5.13: Localizzazione dei dati in territorio UE. Tutti i dati personali degli utenti, inclusi gli asset 
multimediali, devono essere archiviati ed elaborati su infrastrutture fisicamente locate nel territorio 
dell'Unione Europea (es. AWS Region eu-west-1 Irlanda o eu-central-1 Francoforte). Qualsiasi trasferimento
di dati verso paesi terzi deve avvenire nel rispetto delle garanzie previste dagli Art. 44-49 del GDPR, facendo
ricorso a Standard Contractual Clauses (SCC) o a fornitori con certificazione adeguata.
4.6 Cookie e Tracciamento (Direttiva ePrivacy + Provvedimento Garante 2021)
RNF6.1: Cookie banner conforme. Al primo accesso, il sistema deve presentare all'utente un cookie banner 
conforme alle linee guida del Garante per la Protezione dei Dati Personali (provvedimento dell'8 luglio 
2021). Il banner deve illustrare chiaramente le categorie di cookie utilizzati, consentire una scelta granulare 
(accetta tutti / rifiuta tutti / personalizza) e non presentare meccanismi di dark pattern (es. il tasto “rifiuta” 
non può essere meno visibile di “accetta”).
RNF6.2: Cookie tecnici vs. profilazione. I cookie strettamente necessari al funzionamento del sito (es. 
sessione, preferenze di lingua) possono essere impostati senza consenso. I cookie analitici o di profilazione 
(es. Google Analytics, se adottato) devono essere attivati esclusivamente a seguito di consenso esplicito 
dell'utente.
RNF6.3: Persistenza delle preferenze cookie. Le preferenze espresse dall'utente riguardo ai cookie devono 
essere memorizzate e rispettate per un periodo ragionevole (es. 12 mesi), evitando la ripresentazione 
ripetuta del banner ad ogni visita. L'utente deve poter modificare le proprie preferenze in qualsiasi 
momento tramite un link accessibile dal footer del sito.
RNF6.4: Cookie policy. Il sito deve esporre una Cookie Policy dedicata, raggiungibile da qualsiasi pagina 
tramite il footer, che elenchi analiticamente tutti i cookie utilizzati, il loro scopo, la loro durata e il soggetto 
che li imposta (prima o terza parte).
4.7 Termini di Servizio e Obblighi Informativi
RNF7.1: Termini e Condizioni d'uso. Il sito deve esporre Termini e Condizioni d'uso chiari e aggiornati, 
raggiungibili da qualsiasi pagina. I Termini devono disciplinare almeno: le regole di utilizzo della 
piattaforma, la proprietà intellettuale dei contenuti pubblicati dagli autori, le cause di sospensione o 
cancellazione degli account (di competenza del Gestore Utenti per gli iscritti e del Manager Autori per gli 
autori), e la limitazione di responsabilità del gestore.
RNF7.2: Proprietà intellettuale dei contenuti. I Termini devono definire esplicitamente a chi appartengono i 
diritti degli articoli pubblicati sulla piattaforma (all'autore con licenza di pubblicazione alla piattaforma, o 
ceduti interamente). Questa clausola impatta direttamente lo scenario RF3.4, in cui il Manager può 
scegliere di mantenere gli articoli di un autore rimosso.
RNF7.3: Informativa ai sensi del Codice del Consumo (D.Lgs. 206/2005). Il sito deve esporre, in una sezione 
“Chi siamo” o nel footer, le informazioni obbligatorie sull'identità del gestore della piattaforma: ragione 
sociale o nome del titolare, sede legale, indirizzo email di contatto, e Partita IVA o Codice Fiscale.
4.8 Accessibilità (Legge Stanca — L. 4/2004 e s.m.i.)
RNF8.1: Conformità WCAG 2.1 livello AA. L'interfaccia della piattaforma deve essere conforme alle Web 
Content Accessibility Guidelines (WCAG) 2.1 almeno al livello AA, garantendo che i contenuti siano 
percepibili, operabili, comprensibili e robusti per tutti gli utenti, inclusi quelli con disabilità visive, motorie o 
cognitive.

RNF8.2: Navigabilità da tastiera. Tutte le funzionalità principali del sito (navigazione tra articoli, ricerca, 
login, salvataggio) devono essere completamente accessibili tramite tastiera, senza dipendenza dal mouse 
o dal touch.
RNF8.3: Compatibilità con screen reader. Il markup HTML prodotto dal frontend Next.js deve utilizzare 
correttamente i tag semantici e gli attributi ARIA, garantendo la piena compatibilità con i principali screen 
reader in uso (es. NVDA, JAWS, VoiceOver).
RNF8.4: Dichiarazione di accessibilità. Il sito deve pubblicare e mantenere aggiornata una Dichiarazione di 
Accessibilità, raggiungibile dal footer, indicando il livello di conformità raggiunto, le eventuali parti non 
conformi e le alternative fornite, nonché un meccanismo di contatto per segnalare problemi di accessibilità.
4.9 Sicurezza Legalmente Rilevante
RNF9.1: Verifica dell'indirizzo email. A completamento della registrazione, il sistema deve inviare un'email 
di verifica all'indirizzo fornito dall'utente. L'account deve essere attivato solo a seguito del click sul link di 
conferma. Questo requisito previene la registrazione con indirizzi email di terzi e costituisce una misura di 
sicurezza richiesta dalle best practice GDPR (Art. 25 — Privacy by Design).
RNF9.2: Scadenza e invalidazione dei token JWT. I token JWT emessi dal sistema devono avere una durata 
limitata (es. access token di 15-60 minuti, refresh token di 7-30 giorni). Il sistema deve prevedere un 
meccanismo di invalidazione esplicita dei token alla logout, per prevenire il riutilizzo di sessioni 
compromesse.
RNF9.3: Scadenza dei link sensibili. I link inviati via email (recupero password, invito autore, verifica email, 
esportazione dati) devono avere una scadenza temporale definita (es. 24 ore) e devono essere utilizzabili 
una sola volta (one-time token), diventando invalidi dopo il primo utilizzo o alla scadenza.
RNF9.4: Pseudonimizzazione nei log. I file di log di sistema (cfr. RNF4.3) non devono contenere dati 
personali in chiaro (es. email degli utenti). Devono essere utilizzati identificatori interni o pseudonimi, in 
conformità con il principio di minimizzazione del dato (Art. 5 GDPR).
RNF9.5: Controllo degli accessi basato sui ruoli (RBAC). Il sistema deve applicare una rigida separazione dei 
permessi tra i cinque ruoli previsti — Guest, Iscritto, Autore, Manager Autori e Gestore Utenti — 
impedendo a ciascun ruolo l'accesso a funzionalità e dati non di propria competenza (es. un Gestore Utenti 
non deve poter approvare o rifiutare articoli, e un Manager Autori non deve poter sospendere account di 
utenti non autori).

5. Ambiente di destinazione
La piattaforma è un sito web che deve essere disponibile su qualsiasi dispositivo, PC e mobile. Il sito web 
sarà realizzato mediante l'uso delle seguenti tecnologie:
Java e Spring Boot — il cuore del sistema. Framework scelto per la sua solidità, le elevate prestazioni sotto 
sforzo (multithreading nativo) e la scalabilità. Gestirà tutta la logica di business e l'esposizione delle API 
RESTful.
Spring Security — modulo avanzato per la gestione dell'autenticazione e dell'autorizzazione (Role-Based 
Access Control). Garantirà la sicurezza degli endpoint e la rigida separazione dei permessi tra i cinque ruoli 
previsti: Utente Guest, Iscritto, Autore, Manager Autori e Gestore Utenti.
Spring Data JPA (con Hibernate) — ORM (Object-Relational Mapping) utilizzato per mappare le entità del 
dominio sul database, semplificando le query complesse (es. filtri di ricerca, gerarchie delle categorie e 
relazioni tra utenti e articoli salvati).
Swagger (OpenAPI via Springdoc) — strumento integrato per la generazione automatica e interattiva della 
documentazione delle API, essenziale per standardizzare e facilitare la comunicazione con il livello FrontEnd.
Next.js (React) — framework di riferimento per lo sviluppo di interfacce web. L'adozione del Server-Side 
Rendering (SSR) garantirà un'indicizzazione ottimale degli articoli da parte dei motori di ricerca (SEO) e 
tempi di caricamento istantanei per i lettori.
TypeScript — linguaggio che aggiunge la tipizzazione forte al Front-End, riducendo i bug in fase di sviluppo 
e rendendo il codice estremamente manutenibile.
Tailwind CSS — framework CSS utility-first per lo sviluppo di un'interfaccia grafica moderna, pulita, 
accessibile e nativamente mobile-first.
PostgreSQL — database relazionale open-source, selezionato per la sua eccellente integrità dei dati, 
conformità ACID e capacità di gestire moli di dati strutturati (anagrafiche, testi degli articoli, alberature 
complesse).
Cloud Storage (es. AWS S3 o Cloudinary) — servizio esterno dedicato esclusivamente all'archiviazione e 
all'erogazione ottimizzata (CDN) degli asset multimediali, come le foto profilo degli utenti e le immagini di 
copertina degli articoli, al fine di non appesantire il server principale.
JWT (JSON Web Token) — standard industriale per l'autenticazione stateless. Verrà utilizzato per 
mantenere le sessioni degli utenti in modo sicuro ed efficiente, permettendo al Front-End di comunicare i 
privilegi dell'utente al Back-End ad ogni richiesta.
Bcrypt — algoritmo di hashing irreversibile impiegato per la crittografia delle password nel database, 
assicurando la totale protezione delle credenziali anche in caso di violazione dei dati (Data Breach).
HTTPS/TLS — protocollo crittografico per garantire che tutte le comunicazioni tra il client (browser) e i 
server di MotorMindHub siano protette da intercettazioni.
