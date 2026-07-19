# MotorMindHub — System Design Document (v1.0)

> Riferimento tecnico per lo sviluppo. Architettura, decomposizione in sottosistemi, mapping hardware/software, gestione dati, access control, servizi.

**1. Introduzione**

> **1.1 Scopo del sistema**

Il presente documento descrive la progettazione architetturale del sistema MotorMindHub, la piattaforma editoriale per la divulgazione di conoscenza tecnica nell'ambito automobilistico introdotta nel Problem Statement (PS v1.5). Obiettivo del documento è tradurre i requisiti funzionali e non funzionali raccolti nel Requirement Analysis Document (RAD v1.4) in una struttura software concreta: la decomposizione in sottosistemi, la loro distribuzione su hardware e software, le scelte relative alla persistenza dei dati, al controllo degli accessi e alla sicurezza, fino al controllo generale dell'esecuzione del sistema.

Le scelte progettuali qui descritte costituiscono la base per il successivo Object Design Document (ODD), nel quale le singole classi individuate nell'Object Model del RAD (§3.4.4) verranno dettagliate a livello di attributi, metodi e contratti (pre/post-condizioni).

> **1.2 Obiettivi di design**

Il sistema è progettato facendo riferimento ai seguenti obiettivi, derivati dai Requisiti Non Funzionali definiti nel RAD (§3.3):

**1.2.1 Obiettivi di Performance**

> **—** OP1.0: le pagine pubbliche (Home, Esplora Articoli, Dettaglio Articolo) devono risultare renderizzate e interattive in meno di 2-3 secondi su rete 4G standard, grazie al Server-Side Rendering offerto da Next.js (cfr. RNF3.1).
>
> **—** OP2.0: il motore di ricerca full-text e l'applicazione dei filtri combinati per categoria devono restituire risultati con latenza inferiore a 500 millisecondi (cfr. RNF3.2).
>
> **—** OP3.0: il back-end deve poter gestire centinaia di utenti connessi simultaneamente senza degrado percepibile delle prestazioni, tramite un'architettura orizzontalmente scalabile (cfr. RNF3.3).
>
> **—** OP4.0: il sistema deve essere pienamente fruibile da qualsiasi dispositivo, stazionario o mobile, con accesso al Web (cfr. RNF1.1).

**1.2.2 Obiettivi di Affidabilità**

> **—** OA1.0: il sistema deve garantire una disponibilità minima del 99,9% su base annua (cfr. RNF2.1).
>
> **—** OA2.0: i dati sensibili degli utenti devono essere cifrati (hashing Bcrypt per le password) e tutte le comunicazioni client-server devono avvenire esclusivamente su HTTPS/TLS (cfr. RNF2.2, RNF2.3).
>
> **—** OA3.0: il sistema deve essere protetto da SQL injection, Cross-Site Scripting (XSS) e attacchi Denial of Service (cfr. RNF2.4).
>
> **—** OA4.0: deve essere garantito un backup automatico e incrementale giornaliero del database e degli asset multimediali (cfr. RNF2.5).
>
> **—** OA5.0: dopo n tentativi di login falliti, l'account deve essere bloccato temporaneamente, con sblocco confermato via email (cfr. RNF2.6).
>
> **—** OA6.0: i token JWT e i link sensibili inviati via email devono avere durata limitata e invalidazione esplicita dopo l'uso (cfr. RNF9.2, RNF9.3).

**1.2.3 Obiettivi di Manutenzione**

> **—** OM1.0: il codice sorgente deve mantenere una netta separazione delle responsabilità tra Front-End, Back-End e Database, secondo principi object-oriented e pattern architetturali consolidati (cfr. RNF4.1).
>
> **—** OM2.0: devono essere mantenute aggiornate la documentazione tecnica del codice e la documentazione OpenAPI/Swagger delle API (cfr. RNF4.2).
>
> **—** OM3.0: eccezioni ed errori critici devono essere registrati in log centralizzati e protetti, privi di dati personali in chiaro (cfr. RNF4.3, RNF9.4).
>
> **1.3 Definizioni, acronimi e abbreviazioni**
>
> **—** MVC: Model View Controller.
>
> **—** API: Application Programming Interface.
>
> **—** REST: Representational State Transfer.
>
> **—** DTO: Data Transfer Object.
>
> **—** ORM: Object-Relational Mapping.
>
> **—** JPA: Java Persistence API.
>
> **—** JWT: JSON Web Token.
>
> **—** RBAC: Role-Based Access Control.
>
> **—** SSR / CSR: Server-Side Rendering / Client-Side Rendering.
>
> **—** CDN: Content Delivery Network.
>
> **—** CRUD: Create, Read, Update, Delete.
>
> **—** GDPR: General Data Protection Regulation (Reg. UE 2016/679).
>
> **—** DB: Database.
>
> **—** RAD: Requirement Analysis Document.
>
> **—** PS: Problem Statement.
>
> **—** ODD: Object Design Document.
>
> **1.4 Riferimenti**

Per la stesura del presente documento si fa riferimento alla terminologia e ai requisiti definiti in: Problem Statement v1.5 (PS_MotorMindHub_v1.5); Requirement Analysis Document v1.4 (RAD_MotorMindHub_v1.4), in particolare ai Requisiti Funzionali (§3.2), ai Requisiti Non Funzionali (§3.3), all'Object Model (§3.4.4) e all'Ambiente di destinazione (§4).

> **Overview**

Il presente documento riporta i dettagli tecnici della progettazione del sistema MotorMindHub. Le caratteristiche funzionali e gli scenari d'uso sono descritti nel RAD, mentre gli aspetti generali del progetto sono trattati nel PS. Nei capitoli seguenti viene proposta una decomposizione del sistema in sottosistemi, un mapping hardware/software, la gestione dei dati persistenti, i meccanismi di Access Control & Security e il controllo generale del software (Global Software Control). Il capitolo conclusivo riporta i servizi offerti da ciascun sottosistema, derivati dai Requisiti Funzionali e dagli Use Case del RAD.

**2. Architettura Software Attuale**

Come indicato nel RAD (§2 — Sistema attuale), allo stato attuale non esiste alcuna architettura software a supporto di MotorMindHub: la piattaforma è concepita ex novo. Non sussistono pertanto vincoli di migrazione dati né di integrazione con sistemi legacy, condizione che consente di adottare fin da subito un'architettura moderna e disaccoppiata, senza compromessi di retrocompatibilità.

**3. Architettura Software Proposta**

> **Overview**

A differenza di applicazioni web tradizionali a rendering interamente lato server, l'Ambiente di destinazione definito nel RAD (§4) impone esplicitamente un front-end Next.js con Server-Side Rendering, disaccoppiato da un back-end Spring Boot esposto esclusivamente come API RESTful. Questo vincolo tecnologico guida la scelta architetturale: MotorMindHub adotta un'architettura client-server a tre livelli (three-tier), fisicamente distribuita su due applicativi indipendenti che comunicano in JSON su HTTPS, con autenticazione stateless a token (JWT).

Il pattern Model-View-Controller richiamato dal RAD come riferimento (RNF4.1) viene qui applicato non nella sua forma monolitica classica — con le View renderizzate lato server, tipica di applicazioni Spring accoppiate a un template engine — bensì specializzato per un back-end puramente API:

> **—** il Model è rappresentato dalle entità di dominio e dai repository JPA (§3.3);
>
> **—** la View, in senso stretto, non risiede nel back-end ma è demandata interamente al livello di Presentazione Next.js, che riceve dati strutturati (JSON) e li traduce in interfaccia;
>
> **—** il Controller è rappresentato dai REST Controller di Spring, responsabili di ricevere le richieste, delegare la logica applicativa e restituire risposte in formato DTO.

Tra Controller e Model viene introdotto un livello esplicito aggiuntivo, il Service Layer, con funzione di Facade verso ciascun sottosistema: incapsula le regole di business, orchestra le transazioni e pubblica gli eventi di dominio (§3.5) che disaccoppiano gli effetti collaterali — come l'invio di notifiche email — dal flusso principale delle richieste. Questa separazione a quattro livelli (Controller – Service – Repository – Entity) rende il sistema più testabile e manutenibile (OM1.0) rispetto a una divisione MVC a tre soli livelli, ed è la scelta più adatta al contesto di MotorMindHub, dove più sottosistemi condividono regole di business trasversali (es. verifica dei permessi, generazione di notifiche) che meritano un punto di orchestrazione dedicato.

<img src="media/0f494305b0162bab5d7ef55f41c674c6af163ec5.png" style="width:6.29167in;height:7.35417in" />

*Figura 1 — Architettura logica a livelli di MotorMindHub*

> **3.1 Decomposizione in Sottosistemi**

Il sistema viene decomposto in sei sottosistemi funzionali, ciascuno organizzato internamente secondo lo schema a livelli descritto in precedenza (Controller – Service – Repository). La decomposizione rispecchia le aree di responsabilità individuate nel RAD (§3.2) e nella Gerarchia Utenti (§3.4.2), garantendo un'elevata coesione interna e un basso accoppiamento tra sottosistemi, in linea con l'obiettivo di manutenibilità OM1.0.

> **—** GestioneUtenti — registrazione, autenticazione, gestione del profilo, recupero password, segnalazioni e diritti GDPR self-service per Guest e Iscritto (RF1.1–RF1.10).
>
> **—** GestioneArticoli — creazione, modifica, bozze, pubblicazione, ricerca/filtri e liste personali (Preferiti/Leggi più tardi) (RF1.2, RF1.7–RF1.8, RF2.1–RF2.4, RF2.7).
>
> **—** GestioneCategorie — gestione dell'albero gerarchico di navigazione dei contenuti (RF2.5, RF2.6, RF3.5).
>
> **—** GestioneAutori — inviti, revoca e coordinamento del team editoriale, approvazione/rifiuto degli articoli (RF3.1–RF3.6).
>
> **—** GestioneAmministrazioneUtenti — moderazione della community, sospensioni, segnalazioni, richieste GDPR assistite e cronologia amministrativa per il Gestore Utenti (RF4.1–RF4.8).
>
> **—** GestioneNotifiche — invio delle comunicazioni email transazionali, disaccoppiato dagli altri sottosistemi tramite eventi di dominio (§3.5).

La sicurezza e il controllo degli accessi (RBAC) non costituiscono un sottosistema applicativo a sé, ma un livello trasversale (cross-cutting concern) implementato tramite Spring Security e applicato a tutti i sottosistemi, come rappresentato in Figura 2.

<img src="media/8eb7295e1e4746860edc65848377aee0ace446ce.png" style="width:6.29167in;height:1.84375in" />

*Figura 2 — Decomposizione in sottosistemi e relative dipendenze*

> **3.2 Mapping Hardware/Software**

L'architettura è basata su un modello client-server a tre livelli, fisicamente distribuiti su nodi indipendenti, in continuità con quanto dichiarato nel RAD (§4 — Ambiente di destinazione):

> **—** Nodo Client — browser web, su qualsiasi dispositivo stazionario o mobile con accesso al Web.
>
> **—** Nodo Front-End — server Next.js (runtime Node.js), responsabile del Server-Side Rendering delle pagine pubbliche e dell'idratazione dei componenti React lato client.
>
> **—** Nodo Application Server — istanze containerizzate di Spring Boot, esposte dietro un load balancer/reverse proxy HTTPS; essendo stateless (autenticazione JWT), possono essere scalate orizzontalmente aggiungendo istanze per assorbire picchi di traffico (OP3.0).
>
> **—** Nodo Database — istanza PostgreSQL con backup incrementale giornaliero (OA4.0).
>
> **—** Servizi esterni Cloud — Cloud Storage con CDN (AWS S3 o Cloudinary) per l'erogazione ottimizzata degli asset multimediali, e un provider SMTP per l'invio delle email transazionali.

<img src="media/95b74f3cf09ca8d192d36422df9cf30c03381239.png" style="width:6.29167in;height:1.78125in" />

*Figura 3 — Mapping hardware/software (deployment)*

Poiché il RAD lascia aperta la scelta tra AWS S3 e Cloudinary per l'archiviazione degli asset multimediali, il sottosistema che ne fa uso (GestioneUtenti per le foto profilo, GestioneArticoli per le immagini di copertina) espone un'interfaccia CloudStorageService astratta dal provider concreto, secondo il pattern Strategy/Adapter: il provider effettivo viene iniettato come implementazione a runtime, permettendo di sostituirlo senza impatti sul resto del sistema. Questa scelta favorisce la manutenibilità (OM1.0) e riduce il vendor lock-in.

> **3.3 Gestione dei Dati Persistenti**

La persistenza è affidata a Spring Data JPA con Hibernate come provider ORM: lo schema del database PostgreSQL viene derivato dalle entità di dominio, mentre i repository forniscono automaticamente le operazioni CRUD di base, estese con query personalizzate dove necessario (es. ricerca full-text, filtri combinati per categoria).

Le entità principali derivano dall'Object Model del RAD (§3.4.4): Utente, Articolo, Categoria, ArticoloSalvato, InvitoAutore, TokenRecuperoPassword, Segnalazione, RichiestaCancellazione, LogAzioneAmministrativa. La modellazione dei ruoli richiede una decisione di design non banale: il RAD descrive Autore, Manager degli Autori e Gestore Utenti come profili con permessi crescenti (i primi due, in progressione cumulativa) o indipendenti (il terzo). Anziché ricorrere a una gerarchia di eredità JPA tra classi (Utente → Autore → ManagerAutori), soluzione più adatta quando i ruoli comportano attributi o comportamenti strutturalmente diversi, si è scelto un'unica entità Utente con un attributo Ruolo (enumerazione ISCRITTO, AUTORE, MANAGER_AUTORI, GESTORE_UTENTI — il Guest non è persistito, in quanto privo di autenticazione). Questa scelta:

> **—** riflette fedelmente il modello del RAD, dove i permessi sono cumulativi lungo la filiera editoriale e non richiedono comportamenti polimorfici distinti tra le classi;
>
> **—** evita la complessità delle strategie di eredità JPA (SINGLE_TABLE, JOINED, TABLE_PER_CLASS), riducendo query e join non necessari;
>
> **—** si integra naturalmente con Spring Security, che mappa il campo Ruolo direttamente su una GrantedAuthority, semplificando il controllo degli accessi (§3.4);
>
> **—** è coerente con l'obiettivo di manutenibilità OM1.0, a fronte di un dominio applicativo dove la differenza tra ruoli è essenzialmente di permessi, non di struttura dei dati.

Per soddisfare l'obiettivo di performance OP2.0 (ricerca e filtri in meno di 500 ms) senza introdurre un motore di indicizzazione esterno (es. Elasticsearch), sproporzionato rispetto al volume di dati previsto (RNF3.3: centinaia di utenti simultanei, non milioni di documenti), si adotta la ricerca full-text nativa di PostgreSQL, basata su colonne tsvector e indici GIN sui campi Titolo, Testo e Tag di Articolo, combinata con filtri relazionali standard sulla gerarchia di Categoria. Questa scelta privilegia la semplicità dello stack (OM1.0) mantenendo margini di evoluzione: qualora il volume di contenuti crescesse in modo significativo, il motore di ricerca potrà essere estratto in un sottosistema dedicato senza impatti sul resto dell'architettura, grazie all'incapsulamento offerto dal Service Layer.

La gestione dei backup incrementali giornalieri (OA4.0) è demandata al livello infrastrutturale del Nodo Database (§3.2), coerentemente con le garanzie ACID offerte da PostgreSQL.

Il dettaglio di attributi, associazioni, cardinalità e vincoli di ciascuna entità sarà riportato nell'Object Design Document (ODD), a partire dall'Object Model e dagli Statechart Diagram già definiti nel RAD (§3.4.4, §3.4.5.2).

> **3.4 Access Control & Security**

Il controllo degli accessi è interamente delegato a Spring Security, configurato secondo un modello RBAC (Role-Based Access Control) coerente con RNF9.5: ogni endpoint REST dichiara esplicitamente, tramite annotazioni a livello di metodo (@PreAuthorize), quali ruoli sono autorizzati a invocarlo. L'autenticazione è stateless e basata su JWT (RNF2.7): il Front-End allega un access token a ogni richiesta tramite header Authorization; il token ha durata limitata (15-60 minuti) ed è affiancato da un refresh token (7-30 giorni), invalidato esplicitamente al logout (RNF9.2). Le password sono cifrate con Bcrypt (RNF2.2) e non sono mai trasmesse né registrate in chiaro. Un contatore di tentativi falliti per account attiva un blocco temporaneo dopo n tentativi, sbloccabile solo previa conferma via email (RNF2.6). I link sensibili (verifica email, recupero password, invito autore, esportazione dati) sono token monouso con scadenza (RNF9.3). I log applicativi non contengono dati personali in chiaro, in conformità al principio di minimizzazione del dato (RNF9.4).

Il refresh token non è un JWT ma un segreto opaco ad alta entropia (256 bit, generato con SecureRandom): il server ne persiste solo l'hash SHA-256, mai il valore in chiaro, così che un dump del database non esponga token direttamente riutilizzabili. Ogni utilizzo del refresh token ne innesca la rotation (RNF9.2): il token presentato viene revocato immediatamente e sostituito da uno nuovo nella stessa risposta, riducendo la finestra di validità di un token eventualmente intercettato. Se un token già ruotato — e quindi già revocato — viene ripresentato, il sistema lo interpreta come segnale di riuso (il segreto è stato copiato: sia il legittimo proprietario sia un possibile attaccante lo stanno usando) e revoca l'intera famiglia di refresh token attivi dell'utente, costringendo un nuovo login su tutte le sessioni (pratica consolidata, OWASP ASVS 3.3); la richiesta corrente che ha innescato il rilevamento resta comunque rifiutata.

Lo stato dell'account non viene verificato soltanto al login: a ogni richiesta autenticata il filtro JWT ricarica l'utente dal database e ne controlla lo stato (account abilitato, non bloccato) prima di valorizzare il contesto di sicurezza della richiesta. Una sospensione amministrativa (RF4.3) o un blocco anti-bruteforce (RNF2.6) hanno quindi effetto immediato anche su un access token già emesso e non ancora scaduto, invece di restare validi fino alla sua scadenza naturale.

Un AuthenticationEntryPoint e un AccessDeniedHandler dedicati distinguono esplicitamente, nella risposta HTTP, l'assenza di autenticazione valida (401 Unauthorized — nessun token, oppure token scaduto o malformato) dall'autenticazione valida con permessi insufficienti (403 Forbidden — ruolo non autorizzato dal @PreAuthorize dell'endpoint), invece di ricadere su un comportamento di default che li renderebbe indistinguibili lato client.

|                               |                                  |                                                                                 |                                                                                                                       |                                                                                                                      |                                                                                                                                           |
|-------------------------------|----------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Sottosistema**              | **Guest**                        | **Iscritto**                                                                    | **Autore**                                                                                                            | **Manager Autori**                                                                                                   | **Gestore Utenti**                                                                                                                        |
| GestioneUtenti                | registerUser, authenticate       | ↑ + updateProfile, requestAccountDataExport, requestAccountDeletion, reportUser | ↑ (eredita Iscritto)                                                                                                  | ↑ (eredita Autore)                                                                                                   | searchUsers, suspendAccount, reactivateAccount, resolveReport, processAccountDeletion, exportUserDataAssisted, getAdministrativeActionLog |
| GestioneArticoli              | searchArticles, getArticleById   | ↑ + saveArticleToList, removeArticleFromList, getSavedArticles                  | ↑ + createDraft, updateDraft, publishArticle, updatePublishedArticle, deleteDraft, deleteArticle, getArticlesByAuthor | ↑ (eredita Autore)                                                                                                   | —                                                                                                                                         |
| GestioneCategorie             | getCategoryTree, getCategoryById | ↑ (eredita Guest)                                                               | ↑ + createCategory, updateCategory                                                                                    | ↑ + deleteCategory                                                                                                   | —                                                                                                                                         |
| GestioneAutori                | —                                | —                                                                               | —                                                                                                                     | inviteAuthor, listAuthors, removeAuthor, getPendingArticles, approveArticle, rejectArticle, getManagerDashboardStats | —                                                                                                                                         |
| GestioneAmministrazioneUtenti | —                                | —                                                                               | —                                                                                                                     | —                                                                                                                    | ↑ (v. GestioneUtenti)                                                                                                                     |

*Tabella 1 — Matrice Access Control & Security (sottosistemi × ruoli). Il simbolo “↑” indica l'ereditarietà delle funzionalità del ruolo alla sua sinistra, coerentemente con la progressione cumulativa di privilegi definita nella Gerarchia Utenti del RAD (§3.4.2).*

Il Guest (utente non autenticato) accede esclusivamente alle operazioni di lettura pubblica e alla registrazione/login; non possiede un'identità persistita e non compare quindi come destinatario di operazioni di scrittura al di fuori di GestioneUtenti.

> **3.5 Global Software Control**

MotorMindHub è un'applicazione web stateless lato back-end: ogni richiesta HTTP viene gestita in modo indipendente dal Livello Controller, che delega al Service Layer dopo aver verificato autenticazione e autorizzazione (§3.4) — inclusa una rilettura dello stato corrente dell'account dal database, non solo la validità crittografica del token. L'assenza di sessione lato server è quindi letterale, non solo nominale: due richieste consecutive che presentano lo stesso access token vengono valutate in modo completamente indipendente, e nulla di ciò che accade tra l'una e l'altra (es. una sospensione amministrativa) resta "non visto" dal server per la durata residua del token. La concorrenza tra richieste è gestita automaticamente dal servlet container embedded (Apache Tomcat, incluso in Spring Boot) tramite un pool di thread dedicato, mentre l'accesso al database è mediato da un connection pool (HikariCP) che limita il numero di connessioni concorrenti verso PostgreSQL.

Gli effetti collaterali che non devono bloccare la risposta principale — in particolare l'invio delle email da parte di GestioneNotifiche — sono disaccoppiati dal flusso sincrono tramite un meccanismo di eventi di dominio (Domain Events), pubblicati attraverso l'ApplicationEventPublisher di Spring e consumati da listener asincroni (@Async). Ad esempio, la registrazione di un nuovo utente (UC_1) pubblica un evento UtenteRegistrato non appena l'account è salvato: il Service Layer restituisce immediatamente la risposta al client, mentre l'invio dell'email di verifica avviene in background. Questa scelta migliora i tempi di risposta percepiti (OP1.0) e mantiene GestioneNotifiche privo di dipendenze dirette dagli altri sottosistemi, che si limitano a pubblicare eventi (cfr. Figura 2).

In caso di picchi di traffico (OA2.0, OP3.0), il Nodo Application Server è orizzontalmente scalabile: più istanze stateless di Spring Boot possono essere eseguite in parallelo dietro un load balancer (§3.2), senza necessità di sessione condivisa grazie all'autenticazione JWT stateless.

**4. Servizi dei Sottosistemi**

Di seguito sono riportati i servizi esposti da ciascun sottosistema a livello di Service Layer, derivati dai Requisiti Funzionali e dagli Use Case descritti nel RAD. Le firme dei metodi utilizzano Data Transfer Object (DTO) anziché le entità di dominio, per disaccoppiare il contratto delle API dal modello persistente — scelta che riduce il rischio di esporre involontariamente campi sensibili e di introdurre dipendenze cicliche tra livelli (OM1.0). Il dettaglio implementativo di ciascun metodo (pre/post-condizioni) è demandato all'Object Design Document.

> **4.1 GestioneUtenti**

|                                         |                                                                                                                                          |
|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**               | **Descrizione e Contesto**                                                                                                               |
| registerUser(RegisterUserDTO)           | Crea un nuovo Utente in stato non verificato e pubblica l'evento UtenteRegistrato per l'invio dell'email di verifica. (cfr. RF1.3, UC_1) |
| verifyEmail(token)                      | Attiva l'account a seguito del click sul link di verifica ricevuto via email. (cfr. RF1.3, UC_1)                                         |
| \*authenticate(email, password)         | Verifica le credenziali al login; gestito nativamente dalla filter chain di Spring Security. (cfr. RF1.4, UC_2)                          |
| requestPasswordReset(email)             | Genera un TokenRecuperoPassword monouso e pubblica l'evento per l'invio dell'email di recupero. (cfr. RF1.5, UC_3)                       |
| resetPassword(token, NewPasswordDTO)    | Verifica il token e aggiorna la password cifrata dell'utente. (cfr. RF1.5, UC_3)                                                         |
| updateProfile(userId, UpdateProfileDTO) | Aggiorna dati anagrafici, foto profilo e biografia. (cfr. RF1.6, UC_4)                                                                   |
| getPublicProfile(userId)                | Recupera i dati pubblici del profilo di un altro utente. (cfr. RF1.9)                                                                    |
| requestAccountDataExport(userId)        | Genera l'esportazione self-service dei propri dati personali in formato JSON. (cfr. RF1.10)                                              |
| requestAccountDeletion(userId)          | Crea una RichiestaCancellazione in coda al Gestore Utenti (diritto all'oblio). (cfr. RF1.10, UC_25)                                      |
| reportUser(reporterId, ReportUserDTO)   | Crea una Segnalazione e la inoltra alla coda di lavorazione del Gestore Utenti. (cfr. RF1.9, UC_26)                                      |

*\*il metodo è implementato nativamente dalla filter chain di Spring Security.*

> **4.2 GestioneArticoli**

|                                                     |                                                                                                     |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**                           | **Descrizione e Contesto**                                                                          |
| createDraft(authorId, ArticleDraftDTO)              | Crea un nuovo articolo in stato “Bozza”. (cfr. RF2.7, UC_16)                                        |
| updateDraft(draftId, ArticleDraftDTO)               | Aggiorna una bozza esistente, ripristinando l'editor allo stato salvato. (cfr. RF2.7, UC_17)        |
| publishArticle(articleId)                           | Porta l'articolo dallo stato “Bozza” a “In attesa di approvazione”. (cfr. RF2.2, UC_15, UC_17)      |
| updatePublishedArticle(articleId, ArticleUpdateDTO) | Corregge un articolo già pubblicato; le modifiche sono immediatamente visibili. (cfr. RF2.3, UC_20) |
| deleteDraft(draftId)                                | Elimina definitivamente una bozza. (cfr. RF2.7, UC_18)                                              |
| deleteArticle(articleId)                            | Elimina definitivamente un articolo pubblicato. (cfr. RF2.4, UC_19)                                 |
| searchArticles(SearchCriteriaDTO)                   | Ricerca full-text (PostgreSQL tsvector/GIN) combinata con filtri di categoria. (cfr. RF1.2)         |
| getArticleById(articleId)                           | Recupera il dettaglio di un articolo pubblicato. (cfr. RF1.1)                                       |
| getArticlesByAuthor(authorId)                       | Recupera gli articoli (pubblicati e bozze) di un autore per “I miei articoli”. (cfr. RF2.1)         |
| saveArticleToList(userId, articleId, ListType)      | Aggiunge un articolo a “Preferiti” o “Leggi più tardi”. (cfr. RF1.7, UC_6)                          |
| removeArticleFromList(userId, articleId, ListType)  | Rimuove un articolo da una lista personale. (cfr. RF1.7, UC_7)                                      |
| getSavedArticles(userId)                            | Recupera la sezione “I miei salvataggi”. (cfr. RF1.8, UC_7)                                         |

> **4.3 GestioneCategorie**

|                                                 |                                                                                                                             |
|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**                       | **Descrizione e Contesto**                                                                                                  |
| createCategory(CategoryDTO)                     | Crea una nuova categoria specificando nome, categoria padre e descrizione. (cfr. RF2.5, UC_12)                              |
| updateCategory(categoryId, CategoryDTO)         | Modifica il testo descrittivo di una categoria esistente. (cfr. RF2.6, UC_14)                                               |
| deleteCategory(categoryId, ReassignCategoryDTO) | Elimina una categoria obsoleta o duplicata, riassegnando gli articoli “orfani” alla categoria indicata. (cfr. RF3.5, UC_13) |
| getCategoryTree()                               | Recupera l'albero gerarchico completo delle categorie per la navigazione. (cfr. RF1.2)                                      |
| getCategoryById(categoryId)                     | Recupera i dettagli di una singola categoria.                                                                               |

> **4.4 GestioneAutori**

|                                               |                                                                                                                     |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**                     | **Descrizione e Contesto**                                                                                          |
| inviteAuthor(InviteAuthorDTO)                 | Crea un InvitoAutore e pubblica l'evento per l'invio dell'email di invito. (cfr. RF3.3, UC_8, UC_9)                 |
| acceptInvite(token) / declineInvite(token)    | Registra l'accettazione o il rifiuto dell'invito da parte del destinatario. (cfr. UC_10)                            |
| listAuthors()                                 | Recupera la lista completa degli autori attuali. (cfr. RF3.2, UC_8)                                                 |
| removeAuthor(authorId, RemoveAuthorPolicyDTO) | Revoca i permessi di un autore, con opzione di mantenere o eliminare i suoi articoli pregressi. (cfr. RF3.4, UC_11) |
| getPendingArticles()                          | Recupera la coda degli articoli in attesa di approvazione. (cfr. RF3.1, UC_21)                                      |
| approveArticle(articleId)                     | Approva un articolo, rendendolo visibile pubblicamente. (cfr. RF3.6, UC_21)                                         |
| rejectArticle(articleId, RejectionReasonDTO)  | Rifiuta un articolo, notificando l'autore con la motivazione. (cfr. RF3.6, UC_21)                                   |
| getManagerDashboardStats()                    | Recupera le statistiche (es. andamento visite) per la Dashboard Manageriale. (cfr. RF3.1)                           |

> **4.5 GestioneAmministrazioneUtenti**

|                                              |                                                                                                                 |
|----------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**                    | **Descrizione e Contesto**                                                                                      |
| getUserManagementDashboard()                 | Recupera numero utenti registrati, segnalazioni aperte e richieste GDPR in coda. (cfr. RF4.1)                   |
| searchUsers(UserSearchCriteriaDTO)           | Ricerca, filtra e restituisce la lista degli utenti registrati con stato account. (cfr. RF4.2, UC_22)           |
| suspendAccount(userId, SuspensionDTO)        | Sospende un account specificando motivazione e durata; pubblica l'evento di notifica. (cfr. RF4.3, UC_23)       |
| reactivateAccount(userId)                    | Riattiva un account precedentemente sospeso. (cfr. RF4.4, UC_24)                                                |
| getReportsQueue()                            | Recupera la coda di lavorazione delle segnalazioni ricevute dagli utenti. (cfr. RF4.5, UC_26)                   |
| resolveReport(reportId, ReportResolutionDTO) | Archivia, richiede modifica o scala a sospensione una segnalazione. (cfr. RF4.5, UC_26)                         |
| getDeletionRequestsQueue()                   | Recupera la coda delle richieste di cancellazione account. (cfr. RF4.6, UC_25)                                  |
| processAccountDeletion(requestId)            | Verifica i prerequisiti e conferma l'elaborazione della cancellazione (diritto all'oblio). (cfr. RF4.6, UC_25)  |
| exportUserDataAssisted(userId)               | Genera e invia, previa verifica dell'identità, l'esportazione assistita dei dati personali. (cfr. RF4.7, UC_27) |
| getAdministrativeActionLog(filters)          | Recupera la cronologia consultabile delle azioni amministrative compiute sugli account. (cfr. RF4.8)            |

> **4.6 GestioneNotifiche**

Il sottosistema non espone endpoint REST diretti: è costituito da listener asincroni che reagiscono agli eventi di dominio pubblicati dagli altri sottosistemi (§3.5), disaccoppiando l'invio delle email dal flusso sincrono delle richieste.

|                                                     |                                                                                                                                        |
|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Servizio / Operazione**                           | **Descrizione e Contesto**                                                                                                             |
| onUserRegistered(evt)                               | Invia l'email di verifica dell'indirizzo. (cfr. UC_1)                                                                                  |
| onPasswordResetRequested(evt)                       | Invia l'email con il link sicuro di recupero password. (cfr. UC_3)                                                                     |
| onAuthorInvited(evt)                                | Invia l'email di invito con il link per la registrazione. (cfr. UC_9)                                                                  |
| onArticleReviewed(evt)                              | Notifica l'autore dell'approvazione o del rifiuto dell'articolo, con eventuale motivazione. (cfr. UC_21)                               |
| onAccountSuspended(evt) / onAccountReactivated(evt) | Notifica l'utente della sospensione (motivazione e modalità di ricorso) o della riattivazione dell'account. (cfr. RF4.3, UC_23, UC_24) |
| onReportResolutionRequested(evt)                    | Notifica l'utente segnalato della richiesta di modifica del profilo. (cfr. UC_26)                                                      |
| onDataExportReady(evt)                              | Invia il link sicuro e a scadenza per il download dei dati esportati. (cfr. RF1.10, RF4.7)                                             |
| onBruteForceLockout(evt)                            | Invia l'email di conferma per lo sblocco dell'account dopo un blocco per tentativi falliti. (cfr. RNF2.6)                              |
