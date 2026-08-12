# MotorMindHub — Requirement Analysis Document (v1.4)

> Riferimento tecnico: requisiti funzionali (RF), requisiti non funzionali (RNF), scenari, gerarchia utenti, use case (UC_1-UC_28), object model, ambiente di destinazione. Nota: i diagrammi UML del documento originale (immagini) non sono inclusi in questa versione testuale — fare riferimento al PDF originale se serve consultarli visivamente.

1. Introduzione
1.1 Scopo del sistema
La mobilità su gomma rappresenta oggi un pilastro fondamentale della società, coprendo qualsiasi 
esigenza: dagli spostamenti lavorativi alle commissioni quotidiane, fino al tempo libero. L’acquisto di 
un’automobile è un investimento significativo in cui la scelta ricade sul veicolo che meglio risponde alle 
specifiche esigenze dell’utente. Per molti, inoltre, il veicolo trascende la sua natura di mero assemblaggio 
meccanico o mezzo di trasporto, sviluppando una vera e propria componente affettiva e diventando un 
compagno di viaggio affidabile.
Data la crescente complessità ingegneristica dei veicoli odierni, è diventato essenziale promuovere una 
maggiore consapevolezza sul loro funzionamento e mantenimento. Il settore automotive, infatti, 
coinvolge un bacino d’utenza estremamente eterogeneo: si va dal guidatore occasionale che necessita di 
nozioni basilari (come la manutenzione ordinaria o l’orientamento tra i vari segmenti di mercato), fino 
all’appassionato alla ricerca di specifiche tecniche per l’upgrade dei componenti, passando per l’aspirante 
professionista meccatronico desideroso di ampliare il proprio know-how.
In questo contesto nasce MotorMindHub, un progetto concepito con l’obiettivo di centralizzare e 
divulgare la conoscenza tecnica e informativa legata all’ecosistema automobilistico. La piattaforma si 
propone come un hub accessibile e scalabile, ideato per accogliere sia il neofita che si affaccia per la 
prima volta a questo settore, sia l’esperto o il professionista alla ricerca di informazioni mirate e 
dettagliate.
Dal punto di vista strutturale, il progetto consiste in una piattaforma editoriale organizzata 
gerarchicamente in moduli e sotto-moduli. L’architettura delle informazioni prevede una navigazione topdown, dalle categorie principali (es. Case automobilistiche, Storia del brand) ad approfondimenti di 
settore (es. Differenze tra le generazioni di un modello, motorizzazioni) fino a schede ad alta granularità 
(es. Specifiche tecniche di un singolo componente e guide all’acquisto). L’intero ecosistema si fonda 
sull’erogazione di articoli tecnici e guide tematiche.
Il sistema prevede la profilazione di diversi attori, ciascuno dotato di specifici permessi e di un’interfaccia
dedicata:
• Utente Visitatore (Guest) e Utente Registrato che attualmente condividono le medesime 
logiche di interazione lato front-end tranne alcuni aspetti. Possono navigare nel portale, effettuare 
ricerche all’interno del database di articoli e, per l’utente iscritto, utilizzare funzioni di 
bookmarking per salvare i contenuti nei “Preferiti” o in una lista “Leggi più tardi”, oltre a 
segnalare contenuti o profili non conformi ai termini di servizio.
• Autore, che ha accesso a un’area riservata dedicata alla stesura, modifica e gestione dei propri 
articoli, oltre che all’assegnazione delle categorie di competenza.
• Manager degli Autori, la figura di coordinamento editoriale dotata di privilegi avanzati, 
responsabile della supervisione operativa, della moderazione dei contenuti e della gestione degli 
account degli Autori.
• Gestore Utenti, una nuova figura amministrativa, distinta dal Manager degli Autori e con ambito 
di competenza complementare: mentre il Manager degli Autori sovrintende alla filiera editoriale 
(autori e articoli), il Gestore Utenti è responsabile della gestione della base di utenza (Guest e 

Iscritti), della moderazione degli account, della gestione delle segnalazioni ricevute dalla 
community e dell’evasione delle richieste relative all’esercizio dei diritti previsti dal GDPR 
(accesso, rettifica, cancellazione, portabilità). Questa separazione dei ruoli riflette il principio di 
segregazione delle responsabilità (“separation of duties”).
1.2 Ambito del sistema
MotorMindHub è una piattaforma web che copre le seguenti aree funzionali, per fornire le funzionalità 
alle varie figure:
• Gestione area articoli preferiti/da leggere più tardi: dove un utente registrato o guest può 
aggiungere o rimuovere i vari articoli.
• Gestione articoli e sezioni: un autore potrà creare articoli, modificare i propri, assegnargli o 
modificarne la locazione. Il Manager degli Autori è responsabile della gestione degli autori, della 
moderazione degli articoli e della gestione delle sezioni (creazione, rimozione e riorganizzazione 
di categorie e sottocategorie).
• Gestione autori: il Manager degli Autori è colui che invia richieste di aggiunta, rimuove gli 
autori e ne modera l’attività editoriale.
• Gestione utenti iscritti e moderazione account: il Gestore Utenti amministra la base di utenza 
(Guest e Iscritti), gestisce sospensioni e riattivazioni per violazione dei Termini di Servizio, 
gestisce la coda delle segnalazioni ricevute dalla community e le richieste relative ai diritti GDPR
(cancellazione, portabilità). Questa area, rispetto alle versioni precedenti del documento in cui 
tale ruolo era temporaneamente assegnato al Manager degli Autori, è ora affidata a una figura 
amministrativa dedicata e indipendente.
• Sistema di notifica: il sistema implementa un meccanismo di comunicazione basato sull’invio di 
e-mail in determinate circostanze (registrazione, recupero password, invito autori, 
sospensione/riattivazione account, richieste GDPR, segnalazioni).
1.3 Obiettivi e criteri di successo
Il progetto MotorMindHub persegue i seguenti obiettivi:
• O1 – Centralizzazione della conoscenza: offrire un unico punto di accesso a contenuti tecnici 
automotive strutturati gerarchicamente, riducendo la frammentazione delle fonti informative 
disponibili online.
• O2 – Accessibilità per utenze eterogenee: garantire un’esperienza fruibile sia dal neofita sia dal 
professionista, tramite un sistema di categorizzazione e ricerca granulare.
• O3 – Sostenibilità editoriale: consentire una gestione scalabile del team di autori attraverso un 
flusso di moderazione strutturato (proposta, revisione, approvazione).
• O4 – Conformità normativa e fiducia dell’utenza: garantire il rispetto del GDPR e della 
normativa italiana/europea vigente (ePrivacy, Codice del Consumo, Legge Stanca), tramite una 
figura dedicata (Gestore Utenti) responsabile dell’evasione dei diritti degli interessati e della 
moderazione della community.
Il successo del progetto sarà misurato attraverso i seguenti criteri:
• Tempo medio di pubblicazione di un articolo (dalla sottomissione all’approvazione) inferiore a 72
ore.
• Tempo di evasione delle richieste GDPR (cancellazione, portabilità) entro i 30 giorni previsti 
dalla normativa (cfr. RNF5.5, RNF5.6).

• Tempo di gestione di una segnalazione (presa in carico) inferiore a 48 ore.
• Disponibilità della piattaforma pari almeno al 99,9% su base annua (cfr. RNF2.1).
• Conformità WCAG 2.1 livello AA verificata tramite audit periodico (cfr. RNF8.1).
1.4 Definizioni, acronimi e abbreviazioni
Nel seguente documento sono presenti diversi acronimi e termini specifici; se ne riporta il significato:
• RF: Requisito Funzionale.
• RNF: Requisito Non Funzionale.
• UC: Use Case (Caso d’uso).
• NP: Navigational Path (Percorso di navigazione).
• GDPR: General Data Protection Regulation (Regolamento UE 2016/679).
• JWT: JSON Web Token.
• ORM: Object Relational Mapping.
• DPA: Data Processing Agreement.
• RBAC: Role-Based Access Control.
• WCAG: Web Content Accessibility Guidelines.
• Bozza: articolo salvato ma non ancora sottoposto ad approvazione.
• Diritto all’oblio: diritto dell’interessato a ottenere la cancellazione dei propri dati personali (Art. 
17 GDPR).
• Segregazione delle responsabilità (separation of duties): principio organizzativo che 
distribuisce compiti sensibili tra ruoli distinti per ridurre il rischio di abuso di potere o errore.
1.5 Riferimenti
Per la stesura di questo documento si fa riferimento ai termini utilizzati ed ampiamente descritti nel 
documento di Problem Statement (v1.5). I requisiti funzionali e non funzionali qui riportati derivano dagli
scenari descritti nel Problem Statement e sono stati ulteriormente dettagliati in Use Case, Object Model e 
diagrammi dinamici.
1.5.1 Tabella Formati
CAMPO FORMATO MESSAGGIO DI ERRORE
Nome Stringa di testo “Il campo ‘Nome’ è obbligatorio e
non può contenere caratteri 
speciali non validi.”
Cognome Stringa di testo “Il campo ‘Cognome’ è 
obbligatorio e non può contenere 
caratteri speciali non validi.”
Email Stringa (Formato Email valido) “Inserire un indirizzo email valido
(es. utente@provider.it).”
Password Stringa (Alfanumerica, Sicura) “La password non rispetta i criteri
di sicurezza richiesti (es. troppo 
corta o priva di caratteri 
speciali).”
Foto Profilo File Immagine (Opzionale) “Formato file non supportato. 
Caricare un’immagine in formato 

CAMPO FORMATO MESSAGGIO DI ERRORE
JPG o PNG.”
Biografia Stringa di testo (Opzionale) “La biografia ha superato il limite
massimo di caratteri consentiti.”
Consenso Privacy Valore Booleano (Checkbox) “È obbligatorio accettare 
l’informativa sulla privacy per 
procedere con la registrazione.”
Motivazione sospensione Stringa di testo (selezione da 
elenco predefinito + note libere 
opzionali)
“È necessario selezionare una 
motivazione per procedere con la 
sospensione.”
Durata sospensione Numero intero (giorni) o valore 
“Permanente”
“La durata della sospensione non 
è valida.”
Motivazione segnalazione Stringa di testo “È necessario indicare una 
motivazione per la segnalazione.”
1.6 Overview
Il presente documento riporta i requisiti funzionali e non funzionali del sistema MotorMindHub, oltre ai 
modelli di sistema (scenari, gerarchia utenti, use case model, object model, dynamic model, navigational 
paths) che ne descrivono il comportamento atteso. Il documento si basa sul Problem Statement (v1.5) e ne
costituisce il naturale approfondimento in vista della successiva progettazione tecnica (System Design 
Document e Object Design Document).
2. Sistema attuale
Allo stato attuale non esiste alcun sistema informatico a supporto del progetto MotorMindHub: la 
piattaforma è concepita ex novo. Non sussistono pertanto vincoli di migrazione dati o di integrazione con 
sistemi legacy. L’assenza di un sistema preesistente consente di progettare l’architettura e il modello dei 
dati senza compromessi di retrocompatibilità, a beneficio della qualità e della manutenibilità del prodotto 
finale.

3. Sistema proposto
3.1 Overview
Il sistema MotorMindHub è un progetto concepito con l’obiettivo di centralizzare e divulgare la 
conoscenza tecnica e informativa legata all’ecosistema automobilistico. La piattaforma si propone come 
un hub accessibile e scalabile, ideato per accogliere sia il neofita che si affaccia per la prima volta a 
questo settore, sia l’esperto o il professionista alla ricerca di informazioni mirate e dettagliate.
Dal punto di vista strutturale, il progetto consiste in una piattaforma editoriale organizzata 
gerarchicamente in moduli e sotto-moduli, con navigazione top-down dalle categorie principali fino a 
schede ad alta granularità. Il sistema prevede cinque profili distinti: Utente Guest, Utente Iscritto, Autore, 
Manager degli Autori e Gestore Utenti, ciascuno con permessi e interfacce dedicate, come descritto in 
dettaglio nella sezione 3.4.2 (Gerarchia Utenti).
3.2 Requisiti Funzionali
3.2.1 Funzionalità Utente guest e iscritto
Gli Utenti Guest (visitatori non autenticati) e gli Utenti Iscritti condividono le funzionalità di base per la 
fruizione dei contenuti. L’iscrizione sblocca funzionalità aggiuntive di interazione e salvataggio.
RF1.1: Il sistema deve permettere a tutti gli utenti (guest e iscritti) di navigare nel portale e leggere gli 
articoli tecnici e le guide. (cfr. UC_5)
RF1.2: Il sistema deve fornire un motore di ricerca e filtri combinati (es. per “Categoria” e relative 
sottocategorie come “Componentistica”) per individuare articoli specifici. (cfr. UC_5)
RF1.3: Il sistema deve permettere ai visitatori di creare un account fornendo nome, cognome, email, 
password sicura, e opzionalmente una foto profilo e una biografia. La registrazione richiede la verifica 
dell’indirizzo email prima dell’attivazione dell’account. (cfr. UC_1)
RF1.4: Il sistema deve permettere all’utente registrato di effettuare il login tramite le proprie credenziali 
(email e password). (cfr. UC_2)
RF1.5: Il sistema deve inviare un link sicuro via email per permettere all’utente di reimpostare la 
password in caso di smarrimento. (cfr. UC_3)
RF1.6: Il sistema deve permettere all’utente di aggiornare i propri dati personali, inclusi il caricamento di 
una foto profilo e la modifica della biografia. (cfr. UC_4)
RF1.7: Il sistema deve permettere all’utente di salvare gli articoli in liste personali (“Preferiti” o “Leggi 
più tardi”) e di rimuoverli quando non più necessari. (cfr. UC_6, UC_7)
RF1.8: Il sistema deve fornire una sezione dedicata (“I miei salvataggi”) dove l’utente può visualizzare e 
accedere rapidamente alle card di tutti gli articoli salvati. (cfr. UC_7)

RF1.9: Il sistema deve permettere a un utente registrato di segnalare un profilo di un altro utente ritenuto 
non conforme ai Termini di Servizio, indicando una motivazione. La segnalazione deve essere inoltrata 
alla coda di lavorazione del Gestore Utenti. (cfr. UC_26)
RF1.10: Il sistema deve permettere all’utente registrato di richiedere, dalla propria area personale, 
l’esportazione dei propri dati personali in formato strutturato (es. JSON) e la cancellazione definitiva del 
proprio account. (cfr. UC_25)
3.2.2 Funzionalità autore
L’Autore è un content creator con accesso a un’area riservata per la gestione dei propri contenuti 
editoriali.
RF2.1: Il sistema deve fornire un’interfaccia dedicata (“Dashboard Autore”) accessibile post-login. (cfr. 
UC_2)
RF2.2: Il sistema deve disporre di un editor di testo avanzato che consenta all’autore di inserire titolo, 
testo, immagine di copertina, tag e assegnare la categoria di competenza. Al salvataggio, l’articolo deve 
passare in stato di “attesa di approvazione”. (cfr. UC_15)
RF2.3: Il sistema deve permettere all’autore di correggere e aggiornare i propri articoli già pubblicati, 
rendendo le modifiche immediatamente visibili ai lettori. (cfr. UC_20)
RF2.4: Il sistema deve permettere all’autore di eliminare definitivamente gli articoli non ancora 
pubblicati (in stato di bozza) e gli articoli già pubblicati. (cfr. UC_18, UC_19)
RF2.5: Il sistema deve consentire all’autore di creare nuove categorie per l’albero di navigazione, 
specificando nome, categoria padre e descrizione. (cfr. UC_12)
RF2.6: Il sistema deve permettere all’autore di modificare il testo descrittivo delle categorie esistenti. 
(cfr. UC_14)
RF2.7: Il sistema deve permettere ad ogni autore di gestire (salvare, riprendere, modificare, rimuovere) le
bozze dei propri articoli. (cfr. UC_16, UC_17, UC_18)
3.2.3 Funzionalità Manager Autori
Il Manager degli Autori è un amministratore con privilegi avanzati per il coordinamento del team 
editoriale e la moderazione dei contenuti; possiede le stesse funzionalità di un autore, più le seguenti.
RF3.1: Al login, il sistema deve reindirizzare il Manager a un’interfaccia esclusiva contenente statistiche 
(es. grafici sulle visite), lista di articoli da approvare e strumenti di gestione del team editoriale. (cfr. 
UC_2)
RF3.2: Il sistema deve permettere al Manager di visualizzare la lista completa degli autori attuali. (cfr. 
UC_8, UC_11)
RF3.3: Il sistema deve consentire al Manager di aggiungere nuovi membri specificando nome, cognome, 
email e ruolo, generando l’invio automatico di un’email di invito per la registrazione. (cfr. UC_8, UC_9, 
UC_10)

RF3.4: Il sistema deve permettere la revoca dei permessi a un autore esistente, offrendo al Manager 
l’opzione di eliminare o mantenere sul portale gli articoli redatti in passato dall’utente rimosso. (cfr. 
UC_11)
RF3.5: Il sistema deve permettere al Manager di eliminare categorie obsolete o duplicate. Durante 
l’eliminazione, il sistema deve obbligare il Manager a selezionare una nuova categoria a cui riassegnare 
eventuali articoli “orfani”. (cfr. UC_13)
RF3.6: Dopo che un autore ha scritto un articolo, questo deve essere accettato dal Manager se ritenuto 
idoneo alla pubblicazione, oppure rifiutato, con possibilità di indicare una motivazione all’autore. (cfr. 
UC_21)
3.2.4 Funzionalità Gestore Utenti (nuovo)
Il Gestore Utenti è la nuova figura amministrativa, distinta e indipendente dal Manager degli Autori, 
responsabile della gestione della base di utenza (Guest e Iscritti), della moderazione degli account e 
dell’evasione delle richieste relative ai diritti GDPR. La separazione dei permessi tra questo ruolo e quello
del Manager degli Autori riduce la superficie di rischio e consente una moderazione più mirata.
RF4.1: Al login, il sistema deve reindirizzare il Gestore Utenti a una “Dashboard Gestione Utenti” 
esclusiva, distinta da quella del Manager Autori, contenente il numero di utenti registrati, le segnalazioni 
aperte e le richieste GDPR in coda. (cfr. UC_22)
RF4.2: Il sistema deve permettere al Gestore Utenti di ricercare, filtrare e visualizzare la lista completa 
degli utenti registrati (guest esclusi, in quanto non tracciati) con i relativi dettagli e stato dell’account 
(attivo, sospeso, in cancellazione). (cfr. UC_23, UC_24)
RF4.3: Il sistema deve permettere al Gestore Utenti di sospendere un account utente per violazione dei 
Termini di Servizio, specificando una motivazione e una durata (temporanea o permanente). Il sistema 
deve notificare via email l’utente coinvolto, indicando la motivazione e le modalità di ricorso. (cfr. 
UC_23)
RF4.4: Il sistema deve permettere al Gestore Utenti di riattivare un account precedentemente sospeso, 
previa verifica delle condizioni di riammissione, con conferma esplicita e notifica automatica all’utente. 
(cfr. UC_24)
RF4.5: Il sistema deve fornire al Gestore Utenti una coda di lavorazione delle segnalazioni ricevute dagli 
utenti (su profili o comportamenti scorretti), permettendo di visionarle, contattare l’utente segnalato, 
archiviarle o scalarle a sospensione. (cfr. UC_26)
RF4.6: Il sistema deve fornire al Gestore Utenti una coda dedicata alle richieste di cancellazione 
dell’account (diritto all’oblio), permettendo di verificarne i prerequisiti (es. assenza di contenuti editoriali 
in sospeso) e di confermarne l’elaborazione entro i termini di legge. (cfr. UC_25)
RF4.7: Il sistema deve permettere al Gestore Utenti, previa verifica dell’identità del richiedente, di 
generare ed inviare su richiesta assistita l’esportazione dei dati personali di un utente in un formato 
strutturato e leggibile da dispositivo automatico. (cfr. UC_27)
RF4.8: Il sistema deve mantenere una cronologia consultabile dal Gestore Utenti di tutte le azioni 
amministrative compiute sugli account (sospensioni, riattivazioni, cancellazioni, esportazioni), ai fini di 
tracciabilità e accountability. (cfr. UC_23, UC_24, UC_25, UC_27)

3.3 Requisiti Non Funzionali
3.3.1 Usabilità
RNF1.1: L’interfaccia utente deve adattarsi automaticamente e in modo fluido a qualsiasi risoluzione e 
dispositivo (desktop, tablet, smartphone), garantendo una lettura e una navigazione ottimali ovunque.
RNF1.2: I flussi di interazione (dalla registrazione utente alla stesura articoli nella dashboard autori, fino 
alla gestione account nella dashboard del Gestore Utenti) devono richiedere il minor numero di click 
possibile, fornendo sempre feedback visivi chiari (es. notifiche a comparsa per salvataggi o errori).
3.3.2 Affidabilità
RNF2.1: Il sistema deve garantire una disponibilità minima del 99,9% su base annua, assicurando che 
l’hub di informazioni sia costantemente accessibile al pubblico.
RNF2.2: Tutti i dati sensibili degli utenti (come email e password) devono essere crittografati utilizzando 
algoritmi di hashing moderni (nel nostro caso Bcrypt).
RNF2.3: Tutte le comunicazioni client-server devono avvenire tramite protocollo crittografato HTTPS.
RNF2.4: I dati devono essere protetti contro SQL injection e il sito da attacchi DoS e Cross-Site Scripting
(XSS).
RNF2.5: Il sistema deve prevedere un meccanismo di backup automatico e incrementale giornaliero del 
database e degli asset multimediali, garantendo un ripristino rapido in caso di anomalie dei server.
RNF2.6: Devono essere previste misure contro attacchi di bruteforce: dopo n tentativi non andati a buon 
fine di login, l’account sarà bloccato temporaneamente e sarà richiesta la conferma dello sblocco tramite 
email.
RNF2.7: Per l’autenticazione e la comunicazione tra client e server viene utilizzato JWT, che consente di 
mantenere la sicurezza tra i due endpoint durante la sessione. Il token generato ha una durata limitata 
nella sessione e dovrà essere rigenerato periodicamente (vedi RNF9.2).
3.3.3 Prestazioni
RNF3.1: Le pagine destinate al pubblico (Home, visualizzazione articoli) devono essere renderizzate e 
risultare interattive in meno di 2-3 secondi su reti 4G standard.
RNF3.2: Il motore di ricerca interno e l’applicazione dei filtri per categoria devono restituire i risultati in 
tempo reale (tempi di latenza inferiori a 500 millisecondi).
RNF3.3: Il back-end deve essere in grado di gestire centinaia di utenti connessi simultaneamente senza 
mostrare evidenti rallentamenti o colli di bottiglia, predisponendo un’architettura scalabile in caso di 
picchi di traffico.

3.3.4 Manutenzione
RNF4.1: Il codice sorgente deve seguire i principi della programmazione object-oriented e pattern 
architetturali (es. MVC) con una netta separazione delle responsabilità tra Front-End, Back-End e 
Database.
RNF4.2: Devono essere prodotti e mantenuti aggiornati manuali tecnici del codice e la documentazione 
Swagger per le API, al fine di facilitare l’onboarding di nuovi sviluppatori e i futuri upgrade.
RNF4.3: Il server deve registrare le eccezioni e gli errori critici in file di log protetti, consentendo agli 
amministratori tecnici di effettuare un debugging rapido e mirato.
3.3.5 Protezione dei Dati Personali (GDPR — Reg. UE 2016/679)
RNF5.1: Consenso esplicito alla registrazione. Durante il processo di registrazione, il sistema deve 
presentare all’utente un’informativa privacy chiara e leggibile (redatta ai sensi dell’Art. 13 GDPR) e 
raccogliere il consenso esplicito tramite checkbox non pre-selezionata. La registrazione non può essere 
completata senza tale consenso.
RNF5.2: Finalità del trattamento. Il sistema deve trattare i dati personali degli utenti esclusivamente per 
le finalità dichiarate nell’informativa (erogazione del servizio, comunicazioni di sistema). È vietato 
qualsiasi trattamento ulteriore non espressamente consentito dall’utente.
RNF5.3: Diritto di accesso ai propri dati (Art. 15 GDPR). Il sistema deve consentire all’utente registrato 
di visualizzare, dalla propria area personale, tutti i dati personali in suo possesso registrati dal sistema 
(nome, cognome, email, foto profilo, biografia, articoli salvati).
RNF5.4: Diritto di rettifica (Art. 16 GDPR). Il sistema deve consentire all’utente di modificare in 
autonomia i propri dati personali in qualsiasi momento, senza necessità di contattare un amministratore 
(cfr. RF1.6), garantendo tale possibilità per tutti i campi sensibili.
RNF5.5: Diritto alla cancellazione (Art. 17 GDPR — “Diritto all’oblio”). Il sistema deve consentire 
all’utente registrato di richiedere, in autonomia dalla propria area personale, la cancellazione definitiva 
del proprio account e di tutti i dati personali associati (cfr. RF1.10). Qualora la richiesta pervenga tramite 
canali alternativi (es. email di supporto), la richiesta deve poter essere elaborata manualmente dal Gestore
Utenti (cfr. RF4.6). In entrambi i casi, il sistema deve eliminare o anonimizzare irreversibilmente tutti i 
dati entro 30 giorni dalla richiesta e inviare una conferma via email dell’avvenuta cancellazione.
RNF5.6: Diritto alla portabilità dei dati (Art. 20 GDPR). Il sistema deve consentire all’utente di esportare 
autonomamente i propri dati personali in un formato strutturato, di uso comune e leggibile da dispositivo 
automatico (es. JSON o CSV), includendo almeno: dati anagrafici, lista articoli salvati e storico attività 
editoriale per gli autori. In caso di impossibilità tecnica per l’utente, il Gestore Utenti può generare ed 
inviare l’esportazione su richiesta assistita, previa verifica dell’identità (cfr. RF4.7).
RNF5.7: Diritto di opposizione e revoca del consenso (Art. 21 GDPR). Il sistema deve consentire 
all’utente di revocare in qualsiasi momento i consensi precedentemente forniti (es. ricezione email di 
marketing, se introdotte in futuro) con la stessa semplicità con cui sono stati concessi, senza che ciò 
pregiudichi la fruizione del servizio principale.
RNF5.8: Data retention e policy di conservazione. Il sistema deve definire e applicare una policy di 
conservazione dei dati. In particolare: i dati di un utente cancellato devono essere eliminati entro 30 

giorni; i dati di un autore rimosso dal Manager, o di un utente la cui rimozione è gestita dal Gestore 
Utenti, devono essere anonimizzati (gli eventuali contenuti mantenuti non devono essere più riconducibili
alla persona fisica); i log di sistema contenenti dati personali non devono essere conservati per più di 12 
mesi.
RNF5.9: Minimizzazione dei dati (Art. 5 GDPR). Il sistema deve raccogliere esclusivamente i dati 
personali strettamente necessari all’erogazione del servizio. I campi opzionali (foto profilo, biografia) 
devono essere chiaramente indicati come tali e la loro mancata compilazione non deve pregiudicare 
l’accesso alle funzionalità principali.
RNF5.10: Notifica delle violazioni (Art. 33-34 GDPR). Il sistema deve prevedere un meccanismo 
documentato per la rilevazione e la gestione delle violazioni dei dati personali (Data Breach), di cui il 
Gestore Utenti è referente operativo per l’ambito relativo agli account utente. In caso di violazione, il 
titolare del trattamento deve essere in grado di notificare il Garante Privacy entro 72 ore dalla scoperta e, 
se la violazione presenta rischi elevati per gli interessati, notificare anche gli utenti coinvolti senza 
ingiustificato ritardo.
RNF5.11: Registro delle attività di trattamento (Art. 30 GDPR). La piattaforma deve essere 
accompagnata da un Registro delle Attività di Trattamento redatto e mantenuto aggiornato dal titolare del 
trattamento, documentando finalità, categorie di dati trattati, misure di sicurezza adottate e tempi di 
conservazione.
RNF5.12: Designazione del Responsabile del trattamento. Nel caso in cui servizi di terze parti trattino 
dati personali degli utenti per conto della piattaforma (es. AWS S3/Cloudinary per le immagini, servizi 
email per il recupero password), deve essere stipulato un Data Processing Agreement (DPA) con ciascun 
fornitore, ai sensi dell’Art. 28 GDPR.
RNF5.13: Localizzazione dei dati in territorio UE. Tutti i dati personali degli utenti, inclusi gli asset 
multimediali, devono essere archiviati ed elaborati su infrastrutture fisicamente locate nel territorio 
dell’Unione Europea (es. AWS Region eu-west-1 Irlanda o eu-central-1 Francoforte). Qualsiasi 
trasferimento di dati verso paesi terzi deve avvenire nel rispetto delle garanzie previste dagli Art. 44-49 
del GDPR, facendo ricorso a Standard Contractual Clauses (SCC) o a fornitori con certificazione 
adeguata.
3.3.6 Cookie e Tracciamento (Direttiva ePrivacy + Provvedimento Garante 2021)
RNF6.1: Cookie banner conforme. Al primo accesso, il sistema deve presentare all’utente un cookie 
banner conforme alle linee guida del Garante per la Protezione dei Dati Personali (provvedimento dell’8 
luglio 2021). Il banner deve illustrare chiaramente le categorie di cookie utilizzati, consentire una scelta 
granulare (accetta tutti / rifiuta tutti / personalizza) e non presentare meccanismi di dark pattern (es. il 
tasto “rifiuta” non può essere meno visibile di “accetta”).
RNF6.2: Cookie tecnici vs. profilazione. I cookie strettamente necessari al funzionamento del sito (es. 
sessione, preferenze di lingua) possono essere impostati senza consenso. I cookie analitici o di 
profilazione (es. Google Analytics, se adottato) devono essere attivati esclusivamente a seguito di 
consenso esplicito dell’utente.
RNF6.3: Persistenza delle preferenze cookie. Le preferenze espresse dall’utente riguardo ai cookie 
devono essere memorizzate e rispettate per un periodo ragionevole (es. 12 mesi), evitando la 
ripresentazione ripetuta del banner ad ogni visita. L’utente deve poter modificare le proprie preferenze in 

qualsiasi momento tramite un link accessibile dal footer del sito.
RNF6.4: Cookie policy. Il sito deve esporre una Cookie Policy dedicata, raggiungibile da qualsiasi pagina
tramite il footer, che elenchi analiticamente tutti i cookie utilizzati, il loro scopo, la loro durata e il 
soggetto che li imposta (prima o terza parte).
3.3.7 Termini di Servizio e Obblighi Informativi
RNF7.1: Termini e Condizioni d’uso. Il sito deve esporre Termini e Condizioni d’uso chiari e aggiornati, 
raggiungibili da qualsiasi pagina. I Termini devono disciplinare almeno: le regole di utilizzo della 
piattaforma, la proprietà intellettuale dei contenuti pubblicati dagli autori, le cause di sospensione o 
cancellazione degli account (di competenza del Gestore Utenti per gli iscritti e del Manager Autori per gli 
autori), e la limitazione di responsabilità del gestore.
RNF7.2: Proprietà intellettuale dei contenuti. I Termini devono definire esplicitamente a chi 
appartengono i diritti degli articoli pubblicati sulla piattaforma (all’autore con licenza di pubblicazione 
alla piattaforma, o ceduti interamente). Questa clausola impatta direttamente lo scenario RF3.4, in cui il 
Manager può scegliere di mantenere gli articoli di un autore rimosso.
RNF7.3: Informativa ai sensi del Codice del Consumo (D.Lgs. 206/2005). Il sito deve esporre, in una 
sezione “Chi siamo” o nel footer, le informazioni obbligatorie sull’identità del gestore della piattaforma: 
ragione sociale o nome del titolare, sede legale, indirizzo email di contatto, e Partita IVA o Codice 
Fiscale.
3.3.8 Accessibilità (Legge Stanca — L. 4/2004 e s.m.i.)
RNF8.1: Conformità WCAG 2.1 livello AA. L’interfaccia della piattaforma deve essere conforme alle 
Web Content Accessibility Guidelines (WCAG) 2.1 almeno al livello AA, garantendo che i contenuti 
siano percepibili, operabili, comprensibili e robusti per tutti gli utenti, inclusi quelli con disabilità visive, 
motorie o cognitive.
RNF8.2: Navigabilità da tastiera. Tutte le funzionalità principali del sito (navigazione tra articoli, ricerca, 
login, salvataggio) devono essere completamente accessibili tramite tastiera, senza dipendenza dal mouse 
o dal touch.
RNF8.3: Compatibilità con screen reader. Il markup HTML prodotto dal frontend Next.js deve utilizzare 
correttamente i tag semantici e gli attributi ARIA, garantendo la piena compatibilità con i principali 
screen reader in uso (es. NVDA, JAWS, VoiceOver).
RNF8.4: Dichiarazione di accessibilità. Il sito deve pubblicare e mantenere aggiornata una Dichiarazione 
di Accessibilità, raggiungibile dal footer, indicando il livello di conformità raggiunto, le eventuali parti 
non conformi e le alternative fornite, nonché un meccanismo di contatto per segnalare problemi di 
accessibilità.
3.3.9 Sicurezza Legalmente Rilevante
RNF9.1: Verifica dell’indirizzo email. A completamento della registrazione, il sistema deve inviare 
un’email di verifica all’indirizzo fornito dall’utente. L’account deve essere attivato solo a seguito del click
sul link di conferma. Questo requisito previene la registrazione con indirizzi email di terzi e costituisce 

una misura di sicurezza richiesta dalle best practice GDPR (Art. 25 — Privacy by Design).
RNF9.2: Scadenza e invalidazione dei token JWT. I token JWT emessi dal sistema devono avere una 
durata limitata (es. access token di 15-60 minuti, refresh token di 7-30 giorni). Il sistema deve prevedere 
un meccanismo di invalidazione esplicita dei token alla logout, per prevenire il riutilizzo di sessioni 
compromesse.
RNF9.3: Scadenza dei link sensibili. I link inviati via email (recupero password, invito autore, verifica 
email, esportazione dati) devono avere una scadenza temporale definita (es. 24 ore) e devono essere 
utilizzabili una sola volta (one-time token), diventando invalidi dopo il primo utilizzo o alla scadenza.
RNF9.4: Pseudonimizzazione nei log. I file di log di sistema (cfr. RNF4.3) non devono contenere dati 
personali in chiaro (es. email degli utenti). Devono essere utilizzati identificatori interni o pseudonimi, in 
conformità con il principio di minimizzazione del dato (Art. 5 GDPR).
RNF9.5: Controllo degli accessi basato sui ruoli (RBAC). Il sistema deve applicare una rigida 
separazione dei permessi tra i cinque ruoli previsti — Guest, Iscritto, Autore, Manager Autori e Gestore 
Utenti — impedendo a ciascun ruolo l’accesso a funzionalità e dati non di propria competenza (es. un 
Gestore Utenti non deve poter approvare o rifiutare articoli, e un Manager Autori non deve poter 
sospendere account di utenti non autori).
3.4 Modelli di sistema
3.4.1 Scenari
3.4.1.1 Registrazione e autenticazione
Marco è un grande appassionato di motori e, dopo aver letto vari articoli su MotorMindHub come utente 
guest, decide di creare un account per salvare i contenuti.
Raggiunge la home page del sito e fa click sul bottone “Registrati” in alto. Viene rediretto a un form dove 
inserisce: foto profilo (opzionale), nome “Marco”, cognome “Verdi”, la sua email 
“marcoverdi@provider.it”, biografia (opzionale) e una password sicura “Ahgeydg78LF”, per poi fare 
click su “Crea account”. Il sistema gli mostra un messaggio di successo e invia un’email di verifica 
all’indirizzo fornito.
Marco apre la mail e clicca sul link di conferma, attivando così il proprio account. Torna quindi all’home 
page, fa click su “Accedi”, inserisce le credenziali appena create e fa click su “Login”. Viene indirizzato 
alla sua nuova area personale, pronto per esplorare la piattaforma.
3.4.1.2 Modifica password dimenticata
Marco cerca di accedere a MotorMindHub dal suo nuovo tablet, ma non ricorda la password impostata 
durante la registrazione. Dalla pagina di login, fa click sul link “Hai dimenticato la password?”.
Viene rediretto a una nuova pagina dove inserisce l’indirizzo email associato al suo account e fa click su 
“Invia link di recupero”. Poco dopo, riceve un’email contenente un link sicuro e a tempo. Cliccandolo, 
viene indirizzato a una pagina del sito dove può digitare e confermare una nuova password.

Cliccando su “Reimposta password”, a schermo gli compare una notifica verde che lo avvisa 
dell’avvenuto cambio, e viene reindirizzato alla schermata di login per accedere.
3.4.1.3 Modifica dati utente
Marco, dopo aver effettuato il login alla sua area personale, decide di inserire una sua foto profilo.
Fa click sulla voce “Impostazioni profilo” e viene rediretto a una pagina con i suoi dati attuali. Qui decide
di caricare una foto della sua auto come immagine di profilo e aggiorna il campo “Biografia” scrivendo 
della sua passione per i motori aspirati. Una volta completato l’inserimento, fa click sul bottone “Salva 
modifiche”.
Un popup a comparsa lo avvisa che i dati sono stati aggiornati correttamente.
3.4.1.4 Ricerca articolo per filtro
Marco ha bisogno di capire come effettuare la manutenzione dei freni della sua auto. Raggiunge l’home 
page di MotorMindHub e si reca nella sezione “Esplora articoli”. Sulla sinistra dello schermo trova un 
pannello dedicato ai filtri di ricerca: dal menù a tendina “Categoria” seleziona “Manutenzione ordinaria” 
e, sotto la voce “Componentistica”, spunta la casella “Impianto Frenante”. Infine, fa click sul bottone 
“Applica filtri”.
La pagina si aggiorna immediatamente mostrandogli solo le card degli articoli tecnici pertinenti alla sua 
ricerca, facilitando la sua scelta.
3.4.1.5 Salvataggio articolo nei preferiti / Leggere più tardi
Mentre Marco (essendo loggato) naviga tra i risultati filtrati, trova un articolo molto interessante intitolato
“Differenza tra dischi freno forati e baffati”. Inizia a leggerlo, ma si accorge che sta facendo tardi per 
andare al lavoro.
Per non perdere la pagina, sposta il cursore in alto a destra vicino al titolo dell’articolo e fa click 
sull’icona a forma di segnalibro. Dal piccolo menù a tendina che compare, seleziona “Aggiungi a Leggi 
più tardi”. Una notifica a comparsa in basso a sinistra dello schermo gli conferma che l’articolo è stato 
salvato con successo nella sua lista personale.
3.4.1.6 Rimozione articolo nei preferiti / Leggere più tardi
La sera, rientrato a casa, Marco effettua il login, apre la sidebar sinistra della sua area personale e fa click 
sulla voce “I miei salvataggi”.
Viene rediretto a una pagina contenente le card di tutti gli articoli salvati in precedenza. Clicca sulla card 
dell’articolo sui dischi freno e, dopo averlo letto per intero, decide che non ha più bisogno di tenerlo 
memorizzato.
Fa click nuovamente sull’icona del segnalibro (che ora risulta colorata) e seleziona “Rimuovi dai salvati”.
La pagina si aggiorna automaticamente e l’articolo scompare dalla sua lista.

3.4.1.7 Autenticazione Manager autori
Alessandro è l’amministratore e Manager degli autori di MotorMindHub. Per iniziare il suo turno di 
revisione, raggiunge la pagina di login e inserisce le sue credenziali amministrative, facendo poi click su 
“Accedi”.
Il sistema riconosce il suo ruolo speciale e, a differenza di un normale utente, lo reindirizza direttamente 
alla “Dashboard Manageriale”, un’interfaccia complessa contenente grafici sulle visite, la lista degli 
articoli in attesa di approvazione e i pannelli di gestione del team.
3.4.1.8 Aggiunta autore
Dalla sua Dashboard Manageriale, Alessandro decide di invitare Giulia, un’esperta meccatronica, a 
scrivere per il portale.
Dalla sidebar di sinistra fa click su “Gestione Autori” e viene rediretto alla pagina con la lista dell’attuale 
team. Fa click in alto a destra sul bottone “Nuovo Autore”. Si apre un form dove Alessandro inserisce 
nome, cognome, email di Giulia e il ruolo “Autore”.
Dopo aver fatto click su “Invia invito”, il sistema gli mostra una notifica di conferma e invia 
automaticamente un’email a Giulia per completare la registrazione al portale in veste di autrice.
3.4.1.9 Accettazione richiesta di diventare autore
Giulia riceve una email dalla gestione autori di MotorMindHub, la apre e vede che, come accordato in 
precedenza con il manager degli autori, è un invito a diventare autore. Giulia, entusiasta, clicca sul link 
che la porta a fare l’accesso al sito, dopodiché clicca “Accetta” e le viene mostrata una notifica di 
successo.
Le arriva una mail con le credenziali da autore, relative a un account distinto dal suo attuale profilo 
utente. La mail viene inviata anche al manager degli autori, che viene messo al corrente dell’accettazione.
Nel sistema viene registrato questo nuovo autore.
3.4.1.10 Rifiuto richiesta di diventare autore
Giulia riceve una email dalla gestione autori di MotorMindHub, la apre e vede che, come accordato in 
precedenza con il manager degli autori, è un invito a diventare autore. Giulia, avendoci ripensato, clicca 
sul link che la porta a fare l’accesso al sito, dopodiché clicca “Rifiuta” e le viene mostrata una notifica di 
successo.
Le arriva una mail che la informa di aver rifiutato l’incarico. La mail viene inviata anche al manager degli
autori, che viene messo al corrente di ciò.
3.4.1.11 Rimozione autore
Alessandro, controllando le statistiche nella pagina “Gestione Autori”, nota che l’autore Roberto non 
pubblica articoli da oltre due anni e decide di revocargli i permessi per mantenere il database pulito.
Cerca il nome di Roberto nella barra di ricerca della tabella e, una volta trovato, fa click sull’icona dei tre 
puntini posta alla fine della riga corrispondente. Dal menù a tendina seleziona “Rimuovi Autore”. Il 
sistema apre un pop-up di avviso chiedendogli di confermare la scelta e se desidera mantenere o eliminare

gli articoli scritti in passato da Roberto. Alessandro sceglie di mantenerli e clicca su “Conferma 
rimozione”.
3.4.1.12 Creazione categoria
Giulia, la nuova autrice, vuole scrivere una serie di articoli sui veicoli a idrogeno, ma si accorge che non 
esiste una sezione dedicata.
Dalla sua interfaccia autore fa click sulla voce “Categorie” e poi sul bottone “Crea nuova categoria”. 
Viene reindirizzata a un form dove inserisce il nome “Auto a Idrogeno”, seleziona “Alimentazioni 
Alternative” come categoria padre e inserisce una breve descrizione.
Facendo click su “Salva categoria”, il sistema aggiorna l’albero di navigazione del sito, rendendo il nuovo
argomento subito disponibile per i futuri articoli.
3.4.1.13 Rimozione categoria
Durante una riorganizzazione dei contenuti, Alessandro si accorge che le categorie “Motori Termici” e 
“Propulsori a Combustione” sono praticamente dei duplicati.
Dalla sidebar della sua Dashboard, clicca su “Gestione Categorie”. Trova “Propulsori a Combustione” 
nella lista, clicca sull’icona a forma di cestino rossa a lato e, nel pop-up modale che appare, il sistema gli 
chiede a quale altra categoria assegnare gli articoli orfani.
Seleziona “Motori Termici” dal menù a tendina e fa click su “Elimina definitivamente”.
3.4.1.14 Modifica categoria
Giulia sta controllando la pagina della categoria “Pneumatici e Cerchi” e nota un errore grammaticale 
nella descrizione visualizzata dagli utenti.
Dalla sua area riservata va su “Categorie”, cerca quella in questione e fa click sull’icona della matita 
(“Modifica”). Viene rediretta alla pagina di configurazione, corregge il refuso nel box di testo della 
descrizione e fa click sul bottone verde “Aggiorna categoria”.
Una notifica le conferma che la modifica è già visibile online per tutti i lettori.
3.4.1.15 Creazione articolo
Giulia ha preparato un pezzo su come misurare la pressione delle gomme e vuole pubblicarlo.
Dalla sua area autrice fa click su “I miei articoli” e poi sul pulsante “Scrivi nuovo articolo”. Si apre un 
editor di testo avanzato dove inserisce il titolo, copia e incolla il testo del suo pezzo, e usa la barra laterale
per caricare un’immagine di copertina esplicativa. Sempre dalla barra laterale spunta la categoria 
“Manutenzione ordinaria” e aggiunge dei tag rilevanti.
Soddisfatta del risultato, fa click su “Pubblica articolo” e il pezzo va a finire nella lista degli articoli in 
attesa di approvazione del manager degli autori.

3.4.1.16 Salvataggio articolo come bozza
Giulia sta scrivendo un articolo chiamato “Candele adatte per Ape50” ma nota che tra 10 minuti deve 
prendere l’autobus e non ha tempo per ultimarlo. Nell’editor di testo dedicato in cui si trova, scorre fino in
fondo e clicca il pulsante “Salva bozza”.
Le viene mostrata una notifica a schermo del successo della sua operazione e l’articolo viene salvato nella
sezione “Le mie bozze”, a cui può accedere dalla sua area autore.
3.4.1.17 Ripresa bozza e pubblicazione
Dopo essere arrivata a lavoro, Giulia ricorda di aver lasciato in sospeso l’articolo “Candele adatte per 
Ape50” come bozza. Naviga nella sezione “Le mie bozze” dalla sua area autore e trova la card della sua 
bozza. Cliccandoci sopra, si apre l’editor di testo esattamente al punto in cui aveva salvato la bozza.
Dopo averla ultimata, procede con la pubblicazione cliccando sul pulsante in fondo “Pubblica articolo” e 
il pezzo va a finire nella lista degli articoli in attesa di approvazione del manager degli autori.
3.4.1.18 Cancellazione bozza
Giulia sta scorrendo tra le sue bozze e si rende conto che un articolo intitolato “Test marmitte 2021” è 
ormai obsoleto prima ancora di essere ultimato.
Naviga nella sezione “Le mie bozze” e individua la card del documento. Fa click sui tre puntini 
nell’angolo della card, seleziona “Elimina” e conferma la sua decisione nel pop-up a comparsa cliccando 
su “Sì, rimuovi”. L’articolo viene cancellato definitivamente dal server.
3.4.1.19 Rimozione articolo
Giulia sta scorrendo tra i suoi articoli e si rende conto che un articolo intitolato “Test pneumatici 2023” è 
ormai obsoleto.
Naviga nella sezione “I miei articoli”, individua la card del documento. Fa click sui tre puntini 
nell’angolo della card, seleziona “Elimina” e conferma la sua decisione nel pop-up a comparsa cliccando 
su “Sì, rimuovi”. L’articolo viene cancellato definitivamente dal server.
3.4.1.20 Modifica articolo
Poche ore dopo aver pubblicato il pezzo sulla pressione delle gomme, Giulia rilegge il testo e si accorge 
di aver invertito i valori dei bar consigliati tra asse anteriore e posteriore. Entra tempestivamente nella sua
interfaccia autrice, va su “I miei articoli” e cerca il pezzo pubblicato.
Fa click sul bottone “Modifica” accanto al titolo, viene reindirizzata all’editor di testo dove va a 
correggere immediatamente i valori numerici. Infine, fa click su “Aggiorna articolo”. Un avviso a 
comparsa le conferma che i cambiamenti sono stati salvati e i lettori vedranno ora la versione corretta.
3.4.1.21 Autenticazione Gestore Utenti (nuovo)
Elena è la Gestore Utenti di MotorMindHub, la figura amministrativa incaricata della supervisione della 
community e degli account degli iscritti. Per iniziare la sua giornata di lavoro, raggiunge la pagina di 

login e inserisce le proprie credenziali amministrative, facendo poi click su “Accedi”.
Il sistema riconosce il suo ruolo e la reindirizza alla “Dashboard Gestione Utenti”, un’interfaccia distinta 
da quella del Manager degli Autori, contenente il numero di utenti registrati, le segnalazioni aperte, e le 
richieste GDPR in attesa di lavorazione.
3.4.1.22 Sospensione di un utente per violazione dei termini di servizio (nuovo)
Elena, controllando la coda delle segnalazioni, nota che l’utente “Paolo88” è stato segnalato più volte da 
altri iscritti per aver caricato, come immagine di profilo, contenuti non pertinenti e offensivi.
Dalla “Dashboard Gestione Utenti” fa click su “Gestione Account” e cerca “Paolo88” nella barra di 
ricerca della tabella utenti. Apre la scheda del profilo, verifica lo storico delle segnalazioni allegate e fa 
click sul bottone “Sospendi account”.
Nel pop-up che compare, seleziona la motivazione “Violazione dei Termini di Servizio – contenuti 
inappropriati”, imposta una sospensione temporanea di 30 giorni e conferma con “Conferma 
sospensione”. Il sistema disattiva temporaneamente l’accesso dell’account e invia una email a Paolo con 
la motivazione del provvedimento e le modalità per presentare ricorso.
3.4.1.23 Riattivazione di un utente sospeso (nuovo)
Paolo, ricevuta la comunicazione, rimuove l’immagine incriminata e scrive a MotorMindHub per 
chiedere la riattivazione anticipata del proprio account, allegando le proprie scuse.
Elena riceve la richiesta nella sezione “Ricorsi” della Dashboard, apre la scheda dell’utente e verifica che 
il profilo sia stato effettivamente corretto. Fa click su “Riattiva account”, il sistema le chiede conferma 
tramite un pop-up e Elena conferma cliccando su “Conferma riattivazione”.
L’accesso di Paolo viene ripristinato immediatamente e una email automatica lo informa dell’avvenuta 
riattivazione.
3.4.1.24 Gestione di una richiesta di cancellazione account (diritto all’oblio) (nuovo)
Sara, un’utente iscritta, decide di non voler più utilizzare la piattaforma e, dalla propria area personale, fa 
click su “Elimina il mio account” nella sezione “Impostazioni profilo”, confermando la scelta.
La richiesta viene inserita automaticamente nella coda “Richieste di cancellazione” della Dashboard di 
Elena. Elena verifica che non vi siano contenuti in sospeso legati all’account (es. articoli in corso di 
revisione, se l’utente fosse anche autore) e conferma l’elaborazione della richiesta con un click su 
“Procedi con la cancellazione”.
Il sistema elimina o anonimizza irreversibilmente i dati personali di Sara entro i termini di legge e invia 
automaticamente un’email di conferma dell’avvenuta cancellazione, sia a Sara sia in copia interna a Elena
per la tracciabilità dell’operazione.
3.4.1.25 Gestione di una segnalazione tra utenti (nuovo)
Un utente iscritto segnala, tramite l’apposita icona presente sul profilo pubblico, un altro iscritto che 
ritiene stia utilizzando un nome utente offensivo. La segnalazione compare nella “Coda Segnalazioni” 
della Dashboard di Elena, corredata da motivazione e screenshot allegato.

Elena apre la segnalazione, esamina il profilo indicato e valuta che la segnalazione sia fondata. Fa click su
“Richiedi modifica” e invia una comunicazione automatica all’utente, chiedendogli di modificare il 
proprio nome utente entro 7 giorni, pena la sospensione temporanea dell’account. Elena archivia la 
segnalazione come “In gestione”, che rimarrà tracciata nella cronologia fino alla risoluzione.
3.4.1.26 Esportazione assistita dei dati personali (portabilità) (nuovo)
Un utente iscritto contatta il supporto perché, a causa di un problema tecnico con il proprio browser, non 
riesce a utilizzare la funzione di autoesportazione dei dati presente nelle impostazioni del profilo.
Elena, dopo aver verificato l’identità del richiedente tramite l’indirizzo email registrato, accede dalla 
Dashboard alla scheda dell’utente e fa click su “Esporta dati utente”. Il sistema genera un file in formato 
JSON contenente i dati anagrafici, la lista degli articoli salvati e, se applicabile, lo storico editoriale, e lo 
invia in automatico all’indirizzo email verificato dell’utente tramite un link di download sicuro e a 
scadenza.

3.4.2 Gerarchia Utenti
Il sistema prevede cinque ruoli. Guest, Iscritto, Autore e Manager degli Autori costituiscono una 
progressione di privilegi lungo la filiera editoriale (ogni ruolo include le funzionalità del precedente). Il 
Gestore Utenti è invece un ruolo amministrativo indipendente, non derivato dalla catena editoriale, 
assegnato direttamente e dedicato alla gestione della community e degli account, in ottica di separazione 
delle responsabilità.
Gerarchia Utenti

3.4.3 Use Case Model
3.4.3.1 Funzionalità Utente Guest e Registrato
UC_1 Registrazione Utente
Campo Contenuto
Attori Iniziata da Visitatore (Guest)
Condizione di Entrata Il visitatore si trova nella home page di 
MotorMindHub e clicca sul bottone “Registrati”.
# Attore Sistema
1 Il visitatore inserisce i dati nel 
form di registrazione: Foto profilo
(opzionale), Nome, Cognome, 
Email, Password sicura, Biografia
(opzionale), Consenso Privacy 
(checkbox).
2 Il visitatore clicca su “Crea 
account”.
3 Il sistema verifica il formato dei 
dati inseriti.
4 Il sistema verifica che l’email non
sia già associata a un account 
esistente.
5 Il sistema crea il nuovo account, 
mostra un messaggio di successo 
e invia un’email di verifica 
all’indirizzo fornito.
Campo Contenuto
Condizione di Uscita Il visitatore visualizza il messaggio di successo e 
riceve l’email di verifica per attivare l’account.
Eccezioni / Flussi Alternativi UC_1.1 – Formato dati errato: al punto 3, se uno 
o più campi non rispettano il formato atteso 
(Tabella Formati §1.5.1), il sistema evidenzia i 
campi errati. Il flusso torna al punto 1. UC_1.2 – 
Email già in uso: al punto 4, se l’email è già 
registrata, il sistema mostra “Indirizzo email già in 
uso”. Il flusso torna al punto 1. UC_1.3 – 
Consenso Privacy non fornito: al punto 3, se la 
checkbox non è selezionata, il sistema impedisce la 
sottomissione del form (RNF5.1).

Sequence Diagram – UC_1 Registrazione Utente
UC_2 Login
Campo Contenuto
Attori Utente Registrato, Autore, Manager degli Autori
Condizione di Entrata L’attore si trova nella pagina di login e inserisce le 
proprie credenziali.
# Attore Sistema
1 L’attore inserisce email e 
password nel form di login.
2 L’attore clicca su “Accedi”.
3 Il sistema verifica le credenziali e 
il ruolo associato all’account.
4 Il sistema genera un token JWT e 
reindirizza l’utente alla propria 
area personale. In caso di ruolo 
Autore: redirect alla “Dashboard 
Autore”. In caso di ruolo 
Manager: redirect alla 
“Dashboard Manageriale”.

Campo Contenuto
Condizione di Uscita L’attore si trova nella propria area dedicata in base 
al ruolo.
Eccezioni / Flussi Alternativi UC_2.1 – Credenziali errate: al punto 3, il sistema
mostra “Credenziali non valide”. UC_2.2 – 
Account bloccato (brute force): al punto 3, se i 
tentativi falliti superano la soglia (RNF2.6), il 
sistema blocca l’account e invia email di sblocco. 
UC_2.3 – Account non verificato: al punto 3, se 
l’email non è stata confermata (RF1.3), il sistema 
nega l’accesso e invita a verificare la casella email.
Sequence Diagram – UC_2 Login
UC_3 Recupero Password
Campo Contenuto
Attori Utente Registrato
Condizione di Entrata L’utente si trova nella pagina di login e clicca su 
“Hai dimenticato la password?”.
# Attore Sistema
1 L’utente inserisce l’indirizzo 
email associato al proprio 
account.
2 L’utente clicca su “Invia link di 
recupero”.
3 Il sistema verifica che l’email 
corrisponda a un account 

# Attore Sistema
registrato e invia un link sicuro 
one-time con scadenza 24 ore 
(RNF9.3).
4 L’utente apre l’email, clicca sul 
link ed è reindirizzato alla pagina 
di reimpostazione password.
5 L’utente inserisce e conferma la 
nuova password, poi clicca su 
“Reimposta password”.
6 Il sistema aggiorna la password, 
invalida il token, mostra una 
notifica verde e reindirizza alla 
pagina di login.
Campo Contenuto
Condizione di Uscita L’utente si trova nella pagina di login con notifica 
di avvenuto cambio password.
Eccezioni / Flussi Alternativi UC_3.1 – Email non registrata: il sistema mostra 
comunque un messaggio neutro per non rivelare 
l’esistenza dell’account. UC_3.2 – Link scaduto o 
già utilizzato: il sistema mostra un errore e invita a 
richiedere un nuovo link. UC_3.3 – Nuova 
password non valida: il sistema mostra il 
messaggio d’errore (Tabella Formati).

Sequence Diagram – UC_3 Recupero Password
UC_4 Modifica Dati Profilo
Campo Contenuto
Attori Utente Registrato
Condizione di Entrata L’utente ha effettuato il login ed è nella propria area
personale. Clicca su “Impostazioni profilo”.
# Attore Sistema
1 Il sistema mostra la pagina con i 
dati attuali del profilo.
2 L’utente modifica uno o più 
campi (es. carica una nuova foto 
profilo, aggiorna la biografia).
3 L’utente clicca su “Salva 
modifiche”.

# Attore Sistema
4 Il sistema valida i dati inseriti.
5 Il sistema aggiorna il profilo e 
mostra un popup “Dati aggiornati 
correttamente”.
Campo Contenuto
Condizione di Uscita L’utente rimane nella pagina con il popup di 
conferma visibile.
Eccezioni / Flussi Alternativi UC_4.1 – Formato file immagine non 
supportato: il sistema mostra “Formato file non 
supportato. Caricare un’immagine in formato JPG o
PNG.” UC_4.2 – Biografia troppo lunga: il 
sistema mostra il relativo messaggio di errore.
Sequence Diagram – UC_4 Modifica Dati Profilo

UC_5 Ricerca e Filtro Articoli
Campo Contenuto
Attori Visitatore (Guest), Utente Registrato
Condizione di Entrata L’utente si trova nella home page e naviga alla 
sezione “Esplora articoli”.
# Attore Sistema
1 Il sistema mostra la pagina 
“Esplora articoli” con il pannello 
dei filtri e le card degli articoli 
disponibili.
2 L’utente seleziona uno o più filtri 
dal pannello (es. Categoria 
“Manutenzione ordinaria”, 
sottocategoria “Impianto 
Frenante”).
3 L’utente clicca su “Applica filtri”.
4 Il sistema interroga il database e 
aggiorna la pagina in tempo reale 
(latenza < 500 ms, RF1.2) 
mostrando solo le card pertinenti.
Campo Contenuto
Condizione di Uscita La pagina visualizza le card degli articoli filtrati.
Eccezioni / Flussi Alternativi UC_5.1 – Nessun risultato trovato: il sistema 
mostra “Nessun articolo trovato per i filtri 
selezionati” e suggerisce di ampliare la ricerca.

Sequence Diagram – UC_5 Ricerca e Filtro Articoli
UC_6 Salvataggio Articolo (Preferiti / Leggi più tardi)
Campo Contenuto
Attori Utente Registrato (autenticato)
Condizione di Entrata L’utente registrato si trova nella pagina di lettura di 
un articolo.
# Attore Sistema
1 L’utente clicca sull’icona a forma 
di segnalibro in alto a destra 
vicino al titolo dell’articolo.
2 Il sistema mostra un menu a 
tendina con le opzioni “Aggiungi 
ai Preferiti” e “Aggiungi a Leggi 
più tardi”.
3 L’utente seleziona una delle due 

# Attore Sistema
liste.
4 Il sistema salva l’articolo nella 
lista personale selezionata e 
mostra una notifica “Articolo 
salvato con successo”. L’icona 
diventa colorata.
Campo Contenuto
Condizione di Uscita La notifica di conferma è visibile e l’icona del 
segnalibro è colorata.
Eccezioni / Flussi Alternativi UC_6.1 – Utente non autenticato: il sistema 
mostra un prompt che invita al login/registrazione. 
UC_6.2 – Articolo già salvato: il sistema mostra 
una notifica informativa senza creare duplicati.
Sequence Diagram – UC_6 Salvataggio Articolo
UC_7 Rimozione Articolo dai Salvati
Campo Contenuto
Attori Utente Registrato
Condizione di Entrata L’utente autenticato apre la sidebar personale e 
clicca su “I miei salvataggi”.
# Attore Sistema
1 Il sistema mostra la pagina “I miei
salvataggi” con le card di tutti gli 
articoli salvati.

# Attore Sistema
2 L’utente apre l’articolo desiderato.
3 L’utente clicca sull’icona del 
segnalibro (colorata) e seleziona 
“Rimuovi dai salvati”.
4 Il sistema rimuove l’articolo dalla
lista, aggiorna la pagina 
automaticamente e il segnalibro 
torna allo stato non colorato.
Campo Contenuto
Condizione di Uscita La pagina “I miei salvataggi” è aggiornata senza 
l’articolo rimosso.
Eccezioni / Flussi Alternativi UC_7.1 – Lista salvataggi vuota: il sistema mostra
“Non hai ancora articoli salvati” con un 
suggerimento per esplorare il portale.
Sequence Diagram – UC_7 Rimozione Articolo dai Salvati

3.4.3.2 Funzionalità Manager degli Autori — Gestione Team
UC_8 Aggiunta Autore
Campo Contenuto
Attori Manager degli Autori
Condizione di Entrata Il Manager è autenticato nella Dashboard 
Manageriale, accede a “Gestione Autori” e clicca su
“Nuovo Autore”.
# Attore Sistema
1 Il sistema apre il form di invito 
con i campi: Nome, Cognome, 
Email, Ruolo.
2 Il Manager compila il form con i 
dati del nuovo autore.
3 Il Manager clicca su “Invia 
invito”.
4 Il sistema valida i dati e verifica 
che l’email non sia già in uso.
5 Il sistema invia automaticamente 
un’email di invito (link one-time, 
24h) e mostra una notifica di 
conferma al Manager.
Campo Contenuto
Condizione di Uscita Il Manager si trova nella pagina “Gestione Autori” 
con la notifica di conferma invito inviato.
Eccezioni / Flussi Alternativi UC_8.1 – Email già registrata nel sistema: il 
sistema mostra “Questo indirizzo email è già 
registrato nel sistema.” UC_8.2 – Formato dati 
errato: il sistema evidenzia i campi con i relativi 
messaggi di errore.

Sequence Diagram – UC_8 Aggiunta Autore
UC_9 Accettazione Invito Autore
Campo Contenuto
Attori Invitato (futuro Autore)
Condizione di Entrata L’invitato riceve l’email di invito e clicca sul link 
contenuto.
# Attore Sistema
1 L’invitato clicca sul link 
nell’email ed è reindirizzato al 
portale.
2 Il sistema verifica la validità del 
token (non scaduto, non già usato)
e mostra la pagina di conferma 
con i pulsanti “Accetta” e 
“Rifiuta”.
3 L’invitato clicca su “Accetta”.
4 Il sistema registra il nuovo autore,
mostra una notifica di successo e 
invia due email: una all’invitato 
con le credenziali del nuovo 
account autore (separato dal suo 
account utente), una al Manager 
per informarlo dell’accettazione.

Campo Contenuto
Condizione di Uscita L’invitato visualizza la notifica di successo; il 
nuovo account autore è attivo nel sistema.
Eccezioni / Flussi Alternativi UC_9.1 – Link scaduto o già utilizzato: il sistema 
mostra un errore e suggerisce di contattare il 
Manager.
Sequence Diagram – UC_9 Accettazione Invito Autore
UC_10 Rifiuto Invito Autore
Campo Contenuto
Attori Invitato
Condizione di Entrata L’invitato riceve l’email di invito, clicca sul link ed 
è reindirizzato al portale (vedi UC_9, passi 1–2).
# Attore Sistema
1 L’invitato clicca su “Rifiuta”.
2 Il sistema annulla l’invito, mostra 
una notifica di conferma e invia 
due email: una all’invitato per 
informarlo del rifiuto registrato, 
una al Manager per metterlo al 
corrente.
Campo Contenuto
Condizione di Uscita L’invitato visualizza la notifica di conferma. 
Nessun nuovo account viene creato.
Eccezioni / Flussi Alternativi UC_10.1 – Link scaduto o già utilizzato: come 

Campo Contenuto
UC_9.1.
Sequence Diagram – UC_10 Rifiuto Invito Autore

Activity Diagram — Flusso Invito Autore (UC_8, UC_9, UC_10)
Activity Diagram - Invito Autore

UC_11 Rimozione Autore
Campo Contenuto
Attori Manager degli Autori
Condizione di Entrata Il Manager è autenticato nella Dashboard 
Manageriale e si trova nella pagina “Gestione 
Autori”.
# Attore Sistema
1 Il Manager cerca l’autore tramite 
la barra di ricerca e individua la 
riga corrispondente.
2 Il Manager clicca sull’icona dei 
tre puntini e seleziona “Rimuovi 
Autore”.
3 Il sistema apre un pop-up di 
conferma che chiede se procedere
e se mantenere o eliminare gli 
articoli scritti dall’autore.
4 Il Manager seleziona l’opzione 
desiderata e clicca su “Conferma 
rimozione”.
5 Il sistema revoca i permessi 
dell’autore, anonimizza i dati 
personali associati agli articoli 
mantenuti (RNF5.8), aggiorna la 
tabella e notifica l’esito.
Campo Contenuto
Condizione di Uscita La pagina “Gestione Autori” è aggiornata senza 
l’autore rimosso.
Eccezioni / Flussi Alternativi UC_11.1 – Annullamento della rimozione: se il 
Manager clicca su “Annulla”, l’operazione viene 
annullata.

Sequence Diagram – UC_11 Rimozione Autore

Activity Diagram — Rimozione Autore
Activity Diagram - Rimozione Autore

3.4.3.3 Funzionalità Autore — Gestione Categorie
UC_12 Creazione Categoria
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore è autenticato, accede alla sezione 
“Categorie” e clicca su “Crea nuova categoria”.
# Attore Sistema
1 Il sistema mostra il form con i 
campi: Nome, Categoria padre, 
Descrizione.
2 L’autore compila il form.
3 L’autore clicca su “Salva 
categoria”.
4 Il sistema verifica che il nome 
non esista già nell’albero di 
navigazione.
5 Il sistema crea la nuova categoria,
aggiorna l’albero di navigazione e
notifica l’autore.
Campo Contenuto
Condizione di Uscita La nuova categoria è visibile nell’albero di 
navigazione del portale.
Eccezioni / Flussi Alternativi UC_12.1 – Nome categoria già esistente: il 
sistema mostra “Esiste già una categoria con questo
nome”. UC_12.2 – Campo obbligatorio 
mancante: il sistema mostra il relativo messaggio 
di errore.

Sequence Diagram – UC_12 Creazione Categoria
UC_13 Rimozione Categoria
Campo Contenuto
Attori Manager degli Autori
Condizione di Entrata Il Manager è autenticato e si trova nella sezione 
“Gestione Categorie”.
# Attore Sistema
1 Il Manager individua la categoria 
da rimuovere e clicca sull’icona a 
forma di cestino.
2 Il sistema apre un pop-up che 
mostra il numero di articoli 
“orfani” e chiede di selezionare 
una categoria di destinazione 
(RF3.5).
3 Il Manager seleziona la categoria 
di destinazione e clicca su 
“Elimina definitivamente”.
4 Il sistema riassegna gli articoli 
orfani, elimina la categoria, 
aggiorna l’albero e notifica il 
Manager.
Campo Contenuto
Condizione di Uscita La categoria è rimossa; gli articoli sono stati 
spostati nella nuova categoria.
Eccezioni / Flussi Alternativi UC_13.1 – Nessuna categoria alternativa 
disponibile: il sistema blocca l’eliminazione. 

Campo Contenuto
UC_13.2 – Annullamento: se il Manager chiude il 
pop-up senza confermare, la categoria rimane 
invariata.
Sequence Diagram – UC_13 Rimozione Categoria

Activity Diagram — Rimozione Categoria
Activity Diagram - Rimozione Categoria

UC_14 Modifica Categoria
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore accede a “Categorie” e clicca sull’icona 
“Modifica” (matita) accanto alla categoria 
desiderata.
# Attore Sistema
1 Il sistema mostra la pagina di 
configurazione con i campi 
precompilati.
2 L’autore modifica il campo 
desiderato (es. corregge un refuso 
nella descrizione).
3 L’autore clicca su “Aggiorna 
categoria”.
4 Il sistema valida i dati, salva le 
modifiche e le rende 
immediatamente visibili online.
Campo Contenuto
Condizione di Uscita Le modifiche sono visibili a tutti i lettori.
Eccezioni / Flussi Alternativi UC_14.1 – Formato dati errato: se il campo 
Nome è vuoto o la descrizione supera il limite di 
caratteri, il sistema mostra il relativo messaggio di 
errore.

Sequence Diagram – UC_14 Modifica Categoria
3.4.3.4 Funzionalità Autore — Gestione Articoli
UC_15 Creazione e Pubblicazione Articolo
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore accede a “I miei articoli” e clicca su 
“Scrivi nuovo articolo”.
# Attore Sistema
1 Il sistema apre l’editor avanzato: 
Titolo, corpo del testo, immagine 
di copertina, categoria, tag.
2 L’autore compila titolo, testo, 
copertina, categoria e tag.
3 L’autore clicca su “Pubblica 

# Attore Sistema
articolo”.
4 Il sistema valida i campi 
obbligatori e imposta lo stato 
dell’articolo a “In attesa di 
approvazione” (RF2.2).
5 Il sistema mostra una notifica di 
conferma all’autore.
Campo Contenuto
Condizione di Uscita L’articolo è in coda al Manager.
Eccezioni / Flussi Alternativi UC_15.1 – Campo obbligatorio mancante: il 
sistema evidenzia i campi mancanti. UC_15.2 – 
Formato immagine non supportato: il sistema 
mostra il relativo messaggio.
Sequence Diagram – UC_15 Creazione e Pubblicazione Articolo
UC_16 Salvataggio Bozza
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore si trova nell’editor mentre scrive un 
articolo e decide di salvarlo come bozza.
# Attore Sistema
1 L’autore clicca su “Salva bozza”.
2 Il sistema salva lo stato attuale 
con stato “Bozza” in “Le mie 
bozze” e mostra una notifica di 

# Attore Sistema
successo.
Campo Contenuto
Condizione di Uscita La bozza è accessibile dalla sezione “Le mie 
bozze”.
Eccezioni / Flussi Alternativi UC_16.1 – Errore di salvataggio: il sistema 
mostra una notifica di errore e invita a riprovare.
Sequence Diagram – UC_16 Salvataggio Bozza
UC_17 Ripresa Bozza e Pubblicazione
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore naviga alla sezione “Le mie bozze”.
# Attore Sistema
1 Il sistema mostra le card delle 
bozze salvate.
2 L’autore individua la bozza 
desiderata e clicca sulla card.
3 Il sistema apre l’editor 
ripristinando il contenuto al punto
salvato.
4 L’autore finalizza l’articolo e 
clicca su “Pubblica articolo”.
5 Il sistema valida i campi, cambia 
lo stato da “Bozza” a “In attesa di 
approvazione” e notifica l’autore.
Campo Contenuto
Condizione di Uscita L’articolo è in coda; la bozza viene rimossa da “Le 

Campo Contenuto
mie bozze”.
Eccezioni / Flussi Alternativi UC_17.1 – Campo obbligatorio mancante alla 
pubblicazione: come UC_15.1.
Sequence Diagram – UC_17 Ripresa Bozza e Pubblicazione
UC_18 Cancellazione Bozza
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore si trova nella sezione “Le mie bozze”.
# Attore Sistema
1 L’autore seleziona “Elimina” dai 
tre puntini sulla card.
2 Il sistema apre un pop-up “Sei 
sicuro? L’azione è irreversibile.”
3 L’autore clicca su “Sì, rimuovi”.

# Attore Sistema
4 Il sistema elimina definitivamente
la bozza e aggiorna la lista.
Campo Contenuto
Condizione di Uscita La bozza non compare più nella sezione.
Eccezioni / Flussi Alternativi UC_18.1 – Annullamento: se l’autore annulla, la 
bozza rimane invariata.
Sequence Diagram – UC_18 Cancellazione Bozza
UC_19 Rimozione Articolo Pubblicato
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore si trova nella sezione “I miei articoli”.
# Attore Sistema
1 L’autore seleziona “Elimina” dai 
tre puntini sulla card.
2 Il sistema apre un pop-up “Sei 
sicuro? L’azione è irreversibile.”
3 L’autore clicca su “Sì, rimuovi”.
4 Il sistema elimina definitivamente
l’articolo e lo rende non più 
accessibile ai lettori.
Campo Contenuto
Condizione di Uscita L’articolo non è più visibile né nella sezione autore 
né nel portale pubblico.
Eccezioni / Flussi Alternativi UC_19.1 – Annullamento: se l’autore annulla, 
l’articolo rimane invariato.
Nota: RF2.4 consente all’autore di eliminare sia articoli in stato di bozza sia articoli già pubblicati; si 

raccomanda in fase di design di valutare se richiedere un’autorizzazione del Manager per la rimozione di
articoli già pubblicati e indicizzati.
Sequence Diagram – UC_19 Rimozione Articolo Pubblicato
UC_20 Modifica Articolo Pubblicato
Campo Contenuto
Attori Autore
Condizione di Entrata L’autore si trova in “I miei articoli” e clicca su 
“Modifica” accanto all’articolo da correggere.
# Attore Sistema
1 Il sistema apre l’editor 
precompilato con il contenuto 
attuale.
2 L’autore esegue le modifiche 
necessarie.
3 L’autore clicca su “Aggiorna 
articolo”.
4 Il sistema valida i campi, salva le 
modifiche e le rende 
immediatamente visibili ai lettori 
(RF2.3).
Campo Contenuto
Condizione di Uscita I lettori visualizzano la versione aggiornata 
dell’articolo.
Eccezioni / Flussi Alternativi UC_20.1 – Campo obbligatorio svuotato: il 
sistema mostra il relativo messaggio di errore. 
UC_20.2 – Formato immagine non supportato: il
sistema mostra “Formato file non supportato.”

Sequence Diagram – UC_20 Modifica Articolo Pubblicato
Activity Diagram — Creazione, Bozza e Pubblicazione Articolo (UC_15–UC_21)

Activity Diagram - Pubblicazione Articolo
3.4.3.5 Funzionalità Manager degli Autori — Moderazione Contenuti
UC_21 Approvazione / Rifiuto Articolo
Campo Contenuto
Attori Manager degli Autori

Campo Contenuto
Condizione di Entrata Il Manager visualizza la lista degli articoli in stato 
“In attesa di approvazione” (RF3.1, RF3.6).
# Attore Sistema
1 Il Manager seleziona un articolo e
ne visualizza il contenuto 
completo.
2a Flusso approvazione: il Manager 
clicca su “Approva”.
3a Il sistema cambia lo stato in 
“Pubblicato”, lo rende visibile nel
portale e notifica l’autore.
2b Flusso rifiuto: il Manager clicca 
su “Rifiuta” e inserisce una 
motivazione.
3b Il sistema cambia lo stato in 
“Rifiutato” (o lo restituisce come 
bozza modificabile) e notifica 
l’autore con la motivazione.
Campo Contenuto
Condizione di Uscita Approvazione: articolo pubblicato, autore 
notificato. Rifiuto: articolo torna all’autore con la 
motivazione.
Eccezioni / Flussi Alternativi UC_21.1 – Motivazione rifiuto mancante: il 
sistema blocca l’operazione e mostra “Inserire una 
motivazione per il rifiuto.”

Sequence Diagram – UC_21 Approvazione / Rifiuto Articolo
3.4.3.6 Funzionalità Gestore Utenti (nuovo)
Di seguito il dettaglio completo dei nuovi casi d’uso introdotti con questa revisione, relativi alla figura del
Gestore Utenti.
UC_22 Autenticazione Gestore Utenti
Campo Contenuto
Attori Gestore Utenti
Condizione di Entrata Il Gestore Utenti si trova nella pagina di login e 
inserisce le proprie credenziali amministrative.
Flusso degli eventi:

# Attore Sistema
1 Il Gestore Utenti inserisce email e
password e clicca su “Accedi”.
2 Il sistema verifica le credenziali e 
il ruolo associato all’account.
3 Il sistema genera un token JWT e 
reindirizza il Gestore Utenti alla 
“Dashboard Gestione Utenti”, 
contenente il numero di utenti 
registrati, le segnalazioni aperte e 
le richieste GDPR in coda.
Campo Contenuto
Condizione di Uscita Il Gestore Utenti si trova nella Dashboard Gestione 
Utenti.
Eccezioni / Flussi Alternativi UC_22.1 – Credenziali errate: come UC_2.1, il 
sistema mostra “Credenziali non valide”. UC_22.2 
– Account bloccato (brute force): come UC_2.2.
UC_23 Sospensione Account Utente
Campo Contenuto
Attori Gestore Utenti
Condizione di Entrata Il Gestore Utenti è autenticato nella Dashboard 
Gestione Utenti, accede a “Gestione Account” e 
apre la scheda di un utente segnalato o sospetto.
Flusso degli eventi:
# Attore Sistema
1 Il Gestore Utenti cerca l’utente 
nella tabella e apre la scheda del 
profilo.
2 Il sistema mostra i dati del profilo
e lo storico delle segnalazioni 
allegate.
3 Il Gestore Utenti clicca su 
“Sospendi account”.
4 Il sistema apre un pop-up che 
richiede motivazione (da elenco 
predefinito) e durata (temporanea 
in giorni, o permanente).
5 Il Gestore Utenti compila i campi 
e clicca su “Conferma 
sospensione”.
6 Il sistema disattiva l’accesso 
dell’account, registra l’azione 
nella cronologia amministrativa 
(RF4.8) e invia un’email 
all’utente con motivazione e 

# Attore Sistema
modalità di ricorso.
Campo Contenuto
Condizione di Uscita L’account risulta “Sospeso”; l’utente è stato 
notificato via email.
Eccezioni / Flussi Alternativi UC_23.1 – Motivazione mancante: al punto 4, se 
il Gestore Utenti non seleziona una motivazione, il 
sistema blocca l’operazione e mostra il relativo 
messaggio di errore (Tabella Formati §1.5.1). 
UC_23.2 – Annullamento: se il Gestore Utenti 
chiude il pop-up senza confermare, l’operazione 
viene annullata e l’account resta invariato.
Sequence Diagram – UC_22 Autenticazione Gestore Utenti

Sequence Diagram – UC_23 Sospensione Account
UC_24 Riattivazione Account Sospeso
Campo Contenuto
Attori Gestore Utenti
Condizione di Entrata Un utente sospeso ha presentato ricorso; il Gestore 
Utenti accede alla sezione “Ricorsi” della 
Dashboard e apre la scheda dell’utente.
Flusso degli eventi:
# Attore Sistema
1 Il Gestore Utenti verifica che il 
profilo sia stato corretto rispetto 
alla motivazione della 
sospensione.
2 Il Gestore Utenti clicca su 
“Riattiva account”.
3 Il sistema chiede conferma 
tramite pop-up.
4 Il Gestore Utenti clicca su 

# Attore Sistema
“Conferma riattivazione”.
5 Il sistema ripristina 
immediatamente l’accesso, 
registra l’azione nella cronologia 
amministrativa e invia un’email 
automatica di conferma all’utente.
Campo Contenuto
Condizione di Uscita L’account risulta “Attivo”; l’utente è stato 
notificato via email.
Eccezioni / Flussi Alternativi UC_24.1 – Annullamento: al punto 4, se il Gestore
Utenti annulla nel pop-up, l’account resta 
“Sospeso”.
Sequence Diagram – UC_24 Riattivazione Account

UC_25 Gestione Richiesta di Cancellazione Account (Diritto all’oblio)
Campo Contenuto
Attori Utente Registrato, Gestore Utenti
Condizione di Entrata Un utente richiede la cancellazione del proprio 
account dalla propria area personale, oppure tramite
un canale alternativo (es. email di supporto).
Flusso degli eventi:
# Attore Sistema
1 L’utente clicca su “Elimina il mio 
account” nelle “Impostazioni 
profilo” e conferma la scelta.
2 Il sistema inserisce 
automaticamente la richiesta nella
coda “Richieste di cancellazione” 
della Dashboard del Gestore 
Utenti.
3 Il Gestore Utenti apre la richiesta 
e verifica l’assenza di contenuti in
sospeso legati all’account (es. 
articoli in revisione).
4 Il Gestore Utenti clicca su 
“Procedi con la cancellazione”.
5 Il sistema elimina o anonimizza 
irreversibilmente i dati personali 
entro 30 giorni (RNF5.5, RNF5.8)
e invia un’email di conferma sia 
all’utente sia, in copia interna, al 
Gestore Utenti.
Campo Contenuto
Condizione di Uscita L’account e i dati personali associati sono eliminati 
o anonimizzati; entrambe le parti sono state 
notificate.
Eccezioni / Flussi Alternativi UC_25.1 – Contenuti in sospeso: al punto 3, se 
esistono contenuti editoriali in sospeso, il Gestore 
Utenti attende la loro risoluzione prima di poter 
procedere.

Sequence Diagram – UC_25 Cancellazione Account
UC_26 Gestione di una Segnalazione
Campo Contenuto
Attori Utente Registrato (segnalante), Gestore Utenti
Condizione di Entrata Un utente iscritto segnala, tramite l’icona presente 
sul profilo pubblico, un altro iscritto ritenuto non 
conforme ai Termini di Servizio.
Flusso degli eventi:
# Attore Sistema
1 L’utente compila motivazione ed 
eventuale screenshot e invia la 

# Attore Sistema
segnalazione.
2 Il sistema registra la segnalazione 
(stato “Aperta”) nella “Coda 
Segnalazioni” del Gestore Utenti.
3 Il Gestore Utenti apre la 
segnalazione ed esamina il profilo
indicato.
4 Il Gestore Utenti clicca su 
“Richiedi modifica”.
5 Il sistema invia una 
comunicazione automatica 
all’utente segnalato, chiedendo la 
modifica entro 7 giorni pena 
sospensione, e archivia la 
segnalazione come “In gestione”.
Campo Contenuto
Condizione di Uscita La segnalazione risulta “In gestione” e tracciata 
nella cronologia fino alla risoluzione.
Eccezioni / Flussi Alternativi UC_26.1 – Segnalazione infondata: al punto 4, il 
Gestore Utenti può archiviare direttamente la 
segnalazione come “Non fondata” senza contattare 
l’utente segnalato. UC_26.2 – Violazione grave: il 
Gestore Utenti può scalare direttamente la 
segnalazione a sospensione (UC_23) anziché 
richiedere una modifica.

Sequence Diagram – UC_26 Gestione di una Segnalazione
UC_27 Esportazione Assistita dei Dati Personali
Campo Contenuto
Attori Gestore Utenti
Condizione di Entrata Un utente contatta il supporto perché 
impossibilitato tecnicamente a usare 
l’autoesportazione dei dati dal proprio profilo.
Flusso degli eventi:
# Attore Sistema
1 Il Gestore Utenti verifica 
l’identità del richiedente tramite 

# Attore Sistema
l’indirizzo email registrato.
2 Il Gestore Utenti accede alla 
scheda dell’utente e clicca su 
“Esporta dati utente”.
3 Il sistema genera un file JSON 
con dati anagrafici, lista articoli 
salvati e, se applicabile, storico 
editoriale.
4 Il sistema invia automaticamente 
il file all’indirizzo email 
verificato, tramite link di 
download sicuro e a scadenza 
(RNF9.3).
Campo Contenuto
Condizione di Uscita L’utente riceve il link di download; l’operazione è 
tracciata nella cronologia amministrativa (RF4.8).
Eccezioni / Flussi Alternativi UC_27.1 – Identità non verificabile: al punto 1, se
il Gestore Utenti non riesce a verificare l’identità 
del richiedente, l’operazione viene rifiutata e la 
richiesta chiusa senza esportazione.
Sequence Diagram – UC_27 Esportazione Assistita dei Dati Personali

UC_28 Visualizzazione Statistiche di Traffico del Sito
Campo Contenuto
Attori Gestore Utenti
Condizione di Entrata Il Gestore Utenti accede alla propria 
dashboard di amministrazione.
Flusso degli eventi:
# Attore Sistema
1 Il Gestore Utenti apre la dashboard di 
amministrazione.
2 Il sistema calcola e visualizza il numero 
di visite (sessioni browser distinte di 
Guest e Iscritti, cfr. RF3.1) registrate 
oggi, nella settimana corrente, nel mese 
corrente, nell’anno corrente e in totale.
Campo Contenuto
Condizione di Uscita Il Gestore Utenti visualizza i 5 conteggi aggregati.
Eccezioni / Flussi Alternativi Nessuna.
Sequence Diagram – UC_28 Visualizzazione Statistiche di Traffico del Sito

3.4.4 Object Model
Il diagramma seguente rappresenta le principali entità del dominio e le relazioni tra esse, includendo le 
entità di base (Utente, Autore, ManagerAutori, Articolo, Categoria, ArticoloSalvato, InvitoAutore, 
TokenRecuperoPassword) e quelle introdotte per la gestione della community e degli account 
(GestoreUtenti, Segnalazione, RichiestaCancellazione, LogAzioneAmministrativa, VisitaSessione).
Object Model
3.4.5 Dynamic Model
3.4.5.1 Sequence Diagrams
I sequence diagram di tutti i casi d’uso (UC_1–UC_28) sono riportati in coda a ciascun caso d’uso nella 
sezione 3.4.3, direttamente affiancati alla relativa descrizione testuale.

3.4.5.2 Statechart Diagrams
Entity Utente
Statechart Utente
Entity Articolo
Statechart Articolo
Entity InvitoAutore
Statechart InvitoAutore

Entity TokenRecuperoPassword
Statechart TokenRecuperoPassword
Entity Segnalazione (nuovo)
Statechart Segnalazione
Entity RichiestaCancellazione (nuovo)
Statechart RichiestaCancellazione

3.4.5.3 Activity Diagrams
Gli activity diagram sono stati prodotti per i processi che presentano punti decisionali rilevanti ai fini 
della logica di business. I diagrammi relativi a UC_9/UC_10 (Invito Autore), UC_11 (Rimozione Autore),
UC_13 (Rimozione Categoria) e UC_15/UC_21 (Pubblicazione Articolo) sono riportati in coda ai 
rispettivi casi d’uso nella sezione 3.4.3. Il diagramma di UC_1 (Registrazione) e i due diagrammi relativi 
al Gestore Utenti sono riportati di seguito.
Registrazione e Verifica Email (UC_1)
Activity Diagram - Registrazione

Sospensione di un account a seguito di segnalazione (UC_23)
Activity Diagram - Sospensione

Gestione di una richiesta di cancellazione account (UC_25)
Activity Diagram - Cancellazione Account

3.4.6 Navigational Paths
NP1 – Guest
Navigational Path - Guest
NP2 – Lettore (Iscritto)
Navigational Path - Lettore
NP3 – Autore
Navigational Path - Autore
NP4 – Manager Autori

Navigational Path - Manager Autori
NP5 – Gestore Utenti (nuovo)
Navigational Path - Gestore Utenti

3.4.7 Mock-up
I mock-up seguenti rappresentano ad alta fedeltà le interfacce del sistema, coerenti con i Navigational 
Path definiti in §3.4.6 e con gli Use Case di §3.4.3. Sono stati realizzati mantenendo un sistema di design 
unico (palette colori, tipografia, componenti) applicato in modo coerente su tutte le schermate, incluse le 
viste amministrative dei tre ruoli con dashboard (Autore, Manager degli Autori, Gestore Utenti).

Pagine pubbliche e comuni (NP1 – Guest, NP2 – Lettore)
Home Page

Esplora Articoli


Dettaglio Articolo
Menu di salvataggio (Preferiti / Leggi più tardi)
Login

Registrazione

Conferma / verifica email
Recupero password — richiesta

Recupero password — reimposta
Cookie banner

Termini e Condizioni d’Uso

Cookie Policy

Dichiarazione di Accessibilità

Chi Siamo

Area personale Iscritto (NP2)
Area Personale — Panoramica

Impostazioni Profilo

I Miei Salvataggi

Form di Segnalazione profilo/contenuto
Elimina Account (diritto all’oblio)

I Miei Dati ed Esportazione

Area Autore (NP3)
Dashboard Autore

I Miei Articoli

Editor — Nuovo Articolo

Editor — Modifica Articolo

Le Mie Bozze
Popup — Elimina Bozza/Articolo

Categorie (lato Autore)
Form — Crea/Modifica Categoria

Area Manager degli Autori (NP4)
Dashboard Manageriale

Gestione Autori
Form — Nuovo Autore (invito)

Popup — Rimuovi Autore
Accettazione/Rifiuto Invito (lato invitato)

Gestione Categorie
Popup — Riassegnazione articoli orfani

Articoli in Attesa di Approvazione

Revisione Articolo — Approvazione/Rifiuto

Area Gestore Utenti (NP5 — nuovo)
Dashboard Gestione Utenti

Gestione Account

Scheda Profilo Utente

Popup — Sospendi Account
Ricorsi

Popup — Riattiva Account
Coda Segnalazioni

Dettaglio Segnalazione

Coda Richieste di Cancellazione
Popup — Conferma Elaborazione Cancellazione

Cronologia Azioni Amministrative
Conferma Invio Esportazione Dati

Componenti trasversali
Notifiche Toast (successo / errore / info)
 -e 

4. Ambiente di destinazione
La piattaforma è un sito web che deve essere disponibile su qualsiasi dispositivo, PC e mobile. Il sito web
sarà realizzato mediante l’uso delle seguenti tecnologie:
• Java e Spring Boot — il cuore del sistema. Framework scelto per la sua solidità, le elevate 
prestazioni sotto sforzo (multithreading nativo) e la scalabilità. Gestirà tutta la logica di business 
e l’esposizione delle API RESTful.
• Spring Security — modulo avanzato per la gestione dell’autenticazione e dell’autorizzazione 
(Role-Based Access Control). Garantirà la sicurezza degli endpoint e la rigida separazione dei 
permessi tra i cinque ruoli previsti: Utente Guest, Iscritto, Autore, Manager Autori e Gestore 
Utenti.
• Spring Data JPA (con Hibernate) — ORM (Object-Relational Mapping) utilizzato per mappare 
le entità del dominio sul database, semplificando le query complesse (es. filtri di ricerca, 
gerarchie delle categorie e relazioni tra utenti e articoli salvati).
• Swagger (OpenAPI via Springdoc) — strumento integrato per la generazione automatica e 
interattiva della documentazione delle API, essenziale per standardizzare e facilitare la 
comunicazione con il livello Front-End.
• Next.js (React) — framework di riferimento per lo sviluppo di interfacce web. L’adozione del 
Server-Side Rendering (SSR) garantirà un’indicizzazione ottimale degli articoli da parte dei 
motori di ricerca (SEO) e tempi di caricamento istantanei per i lettori.
• TypeScript — linguaggio che aggiunge la tipizzazione forte al Front-End, riducendo i bug in fase
di sviluppo e rendendo il codice estremamente manutenibile.
• Tailwind CSS — framework CSS utility-first per lo sviluppo di un’interfaccia grafica moderna, 
pulita, accessibile e nativamente mobile-first.
• PostgreSQL — database relazionale open-source, selezionato per la sua eccellente integrità dei 
dati, conformità ACID e capacità di gestire moli di dati strutturati (anagrafiche, testi degli articoli,
alberature complesse).
• Cloud Storage (es. AWS S3 o Cloudinary) — servizio esterno dedicato esclusivamente 
all’archiviazione e all’erogazione ottimizzata (CDN) degli asset multimediali, come le foto 
profilo degli utenti e le immagini di copertina degli articoli, al fine di non appesantire il server 
principale.
• JWT (JSON Web Token) — standard industriale per l’autenticazione stateless. Verrà utilizzato 
per mantenere le sessioni degli utenti in modo sicuro ed efficiente, permettendo al Front-End di 
comunicare i privilegi dell’utente al Back-End ad ogni richiesta.
• Bcrypt — algoritmo di hashing irreversibile impiegato per la crittografia delle password nel 
database, assicurando la totale protezione delle credenziali anche in caso di violazione dei dati 
(Data Breach).
• HTTPS/TLS — protocollo crittografico per garantire che tutte le comunicazioni tra il client 
(browser) e i server di MotorMindHub siano protette da intercettazioni.

5. Glossario
• Articolo: contenuto editoriale tecnico o guida tematica pubblicato da un Autore, organizzato in 
una o più categorie.
• Bozza: articolo salvato dall’Autore ma non ancora sottoposto al flusso di approvazione.
• Categoria: nodo dell’albero di navigazione gerarchico dei contenuti (es. “Manutenzione 
ordinaria” > “Impianto Frenante”).
• Dashboard Gestione Utenti: interfaccia amministrativa esclusiva del Gestore Utenti, contenente 
il numero di utenti registrati, le segnalazioni aperte e le richieste GDPR in coda.
• Dashboard Manageriale: interfaccia amministrativa esclusiva del Manager degli Autori, 
contenente statistiche, articoli in attesa di approvazione e strumenti di gestione del team 
editoriale.
• Diritto all’oblio: diritto dell’interessato, previsto dall’Art. 17 GDPR, a ottenere la cancellazione 
dei propri dati personali.
• Iscritto: utente registrato e autenticato, con permessi di salvataggio articoli e segnalazione 
contenuti/profili.
• Lista Preferiti / Leggi più tardi: raccolte personali di articoli salvati dall’utente iscritto.
• Log Azione Amministrativa: registrazione tracciata di un’azione compiuta da Manager degli 
Autori o Gestore Utenti (sospensione, riattivazione, cancellazione, esportazione, rimozione 
autore, ecc.), ai fini di accountability.
• Ricorso: richiesta presentata da un utente sospeso al Gestore Utenti per ottenere la riattivazione 
anticipata del proprio account.
• Segnalazione: notifica inviata da un utente riguardo a un profilo o comportamento ritenuto non 
conforme ai Termini di Servizio, gestita dal Gestore Utenti.
• Separazione delle responsabilità (separation of duties): principio organizzativo per cui compiti
sensibili (gestione editoriale vs. gestione utenti) sono affidati a ruoli distinti, per ridurre il rischio 
di abuso o errore.
• Token one-time: token di sicurezza generato per un singolo utilizzo, con scadenza temporale 
definita, impiegato per operazioni sensibili (recupero password, invito autore, verifica email, 
esportazione dati).
