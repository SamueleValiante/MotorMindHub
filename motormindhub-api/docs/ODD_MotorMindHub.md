# MotorMindHub — Object Design Document (v1.0)

> Riferimento tecnico per lo sviluppo. Trade-off, convenzioni di naming, struttura dei pacchetti, contratti OCL (pre/post-condizioni) per ciascun sottosistema.

**1. Introduzione**

Il presente documento costituisce l'Object Design Document (ODD) del sistema MotorMindHub. A partire dalla decomposizione in sottosistemi e dai servizi individuati nel System Design Document (SDD v1.0), l'ODD ne dettaglia la realizzazione a livello di classi: pacchetti, invarianti e contratti (pre/post-condizioni) di ciascun metodo, secondo la notazione OCL (Object Constraint Language). L'obiettivo è fornire una specifica sufficientemente precisa da guidare l'implementazione senza lasciare ambiguità sulle regole di business, mantenendo al contempo la tracciabilità verso i Requisiti Funzionali (RF) e gli Use Case (UC) del RAD.

> **1.1 Definizioni, acronimi e abbreviazioni**
>
> **—** MVC: Model View Controller.
>
> **—** DB: Database.
>
> **—** JDBC: Java DataBase Connectivity.
>
> **—** OCL: Object Constraint Language, notazione formale per la specifica di invarianti e pre/post-condizioni.
>
> **—** DTO: Data Transfer Object.
>
> **—** RAD: Requirement Analysis Document.
>
> **—** PS: Problem Statement.
>
> **—** SDD: System Design Document.
>
> **1.2 Riferimenti**

Per la stesura di questo documento si fa riferimento alla terminologia e ai requisiti definiti in: Problem Statement v1.5, Requirement Analysis Document v1.4 (Object Model §3.4.4, Statechart Diagram §3.4.5.2) e System Design Document v1.0 (decomposizione in sottosistemi §3.1, gestione dei dati persistenti §3.3, servizi dei sottosistemi §4).

> **1.3 Trade-offs**

Di seguito sono documentate le principali decisioni di design che hanno comportato un compromesso tra dimensioni di qualità in conflitto, coerentemente con le scelte architetturali già motivate nell'SDD.

**1.3.1 Funzionalità vs Time-to-Market**

A differenza di un approccio MVP che rimanda le funzionalità meno critiche, per MotorMindHub si è scelto di realizzare fin dalla prima versione tutti e cinque i ruoli e l'intero flusso di gestione dei diritti GDPR (esportazione, cancellazione, segnalazioni). Questa scelta allunga i tempi di consegna ma è imposta dal dominio: la separazione dei permessi tra Manager Autori e Gestore Utenti (RAD §1.1) e la conformità GDPR (RNF5.x–RNF9.x) non sono funzionalità accessorie rimandabili, bensì vincoli strutturali del sistema.

**1.3.2 Minimizzazione degli Errori vs Funzionalità**

L'uso sistematico di DTO validati (Bean Validation) su ogni endpoint e la scelta di una ricerca full-text nativa PostgreSQL invece di un motore esterno (SDD §3.3) riducono la superficie di errore a scapito di funzionalità di ricerca più sofisticate (es. ricerca semantica), rimandabili a una fase successiva senza impatti architetturali.

**1.3.3 Manutenibilità vs Efficienza**

La rappresentazione dei ruoli tramite un'unica entità Utente con attributo Ruolo, invece di una gerarchia di ereditarietà JPA (SDD §3.3), comporta query leggermente meno dirette (filtri su un campo enum anziché join polimorfici) ma riduce sensibilmente la complessità del modello e il rischio di errori nelle strategie di mapping ereditario.

**1.3.4 Scalabilità vs Costo Infrastrutturale**

La ricerca full-text basata su indici GIN di PostgreSQL (SDD §3.3) evita l'introduzione di un motore di indicizzazione esterno (es. Elasticsearch), riducendo costi e complessità operativa; il compromesso è una minore scalabilità della ricerca in scenari di crescita molto elevata del catalogo articoli, accettabile alla luce dei volumi attesi (RNF3.3).

**1.3.5 Reattività Percepita vs Complessità Implementativa**

L'adozione di eventi di dominio asincroni per il sottosistema GestioneNotifiche (SDD §3.5) introduce la necessità di un event bus e di listener @Async, aumentando la complessità implementativa rispetto a una chiamata sincrona diretta; il beneficio è un tempo di risposta percepito inferiore (OP1.0) sulle operazioni che scatenano l'invio di una email.

**1.3.6 Tracciabilità dei Requisiti vs Costo di Documentazione**

Ogni servizio dell'SDD e ogni contratto del presente ODD riporta un riferimento esplicito a Requisiti Funzionali e Use Case. Il costo di mantenimento di questa tracciabilità end-to-end (PS → RAD → SDD → ODD) è significativo, ma è ritenuto necessario in un sistema con requisiti di conformità legale (GDPR) verificabili in sede di audit.

**1.3.7 Manutenibilità vs Retrocompatibilità**

Non esistendo un sistema legacy (RAD §2), si adottano le versioni correnti dello stack dichiarato (Spring Boot, Next.js, PostgreSQL) senza vincoli di retrocompatibilità, privilegiando la manutenibilità a lungo termine rispetto alla compatibilità con versioni precedenti mai esistite.

**1.3.8 Sicurezza vs Usabilità**

L'uso di access token JWT a durata limitata affiancati da refresh token (RNF9.2) aumenta la sicurezza riducendo la finestra di validità di un token compromesso, ma richiede l'implementazione lato Front-End di un meccanismo di refresh trasparente per non penalizzare l'esperienza dell'utente con logout inattesi.

> **1.4 Linee guida**

**1.4.1 Naming convention generale**

> **—** Nomi di classi brevi ma efficaci; nomi di metodi medio-corti ma esplicativi; tutti i nomi devono essere significativi.
>
> **—** Pacchetti: lower-case.
>
> **—** Classi (Entity, Service, Controller): PascalCase.
>
> **—** Metodi e variabili: camelCase.
>
> **—** Data Transfer Object: suffisso DTO in PascalCase (es. RegisterUserDTO).
>
> **—** Enumerazioni: nome della enum in PascalCase, valori in UPPER_SNAKE_CASE (es. StatoArticolo.IN_ATTESA_APPROVAZIONE).
>
> **—** Classi di servizio: prefisso Gestione seguito dal nome del sottosistema in PascalCase (es. GestioneUtenti), coerentemente con la denominazione adottata nell'SDD.

**1.4.2 Naming convention risorse**

> **—** Endpoint REST: kebab-case, versionati (es. /api/v1/gestione-utenti/richieste-cancellazione).
>
> **—** Campi dei payload JSON (request/response): camelCase, coerente con le convenzioni TypeScript del Front-End Next.js.
>
> **—** File di risorse, asset e migrazioni Flyway: lower-case, parole composte concatenate con “\_” (es. V1\_\_create_utente_table.sql).

**2. Pacchetti**

L'implementazione del back-end di MotorMindHub è dominata dall'uso di Spring Boot. Come stabilito nell'SDD (§3), il Front-End Next.js risiede in un repository e in un processo di deployment indipendenti, e non è pertanto oggetto del presente documento: l'ODD descrive esclusivamente la struttura delle classi del back-end, che espone i propri servizi come API RESTful.

> **—** pom.xml: Project Object Model per la configurazione delle dipendenze e della build (Maven).
>
> **—** src/main/java/com/motormindhub/api: root package che contiene tutto il codice del back-end.
>
> **—** src/main/resources: file di configurazione (application.yml) e script di migrazione dello schema (Flyway), che sostituiscono la generazione automatica dello schema in produzione per garantire versionamento e tracciabilità delle modifiche al database (cfr. RNF4.2).
>
> **—** MotorMindHubApiApplication.java: starting point dell'applicazione Spring Boot.

Non essendo previsto alcun template engine lato server — le View sono demandate interamente al Front-End Next.js, come stabilito nell'SDD (§3, Overview) — non esiste, a differenza di applicazioni Spring accoppiate a Thymeleaf, un pacchetto equivalente a /templates.

Il codice del back-end è organizzato nei seguenti pacchetti:

> **—** /config — classi di configurazione dichiarativa: SecurityConfig (filter chain JWT e regole RBAC), OpenApiConfig (documentazione Swagger, cfr. RNF4.2), AsyncConfig (thread pool per i listener di eventi), CorsConfig, CloudStorageConfig.
>
> **—** /security — componenti dedicati all'autenticazione stateless: JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl. Separato da /config per isolare la logica di sicurezza pura dalla sua configurazione dichiarativa.
>
> **—** /events — le classi degli eventi di dominio (es. UtenteRegistratoEvent, ArticoloRecensitoEvent, AccountSospesoEvent) pubblicate dal Service Layer, e i relativi listener asincroni: costituiscono l'implementazione del meccanismo di Global Software Control descritto nell'SDD (§3.5).
>
> **—** /model — contiene: 1) /entity, le classi persistenti che mappano le tabelle del database tramite JPA, con le relative enumerazioni di stato; 2) /repository, le interfacce Spring Data JPA che forniscono le operazioni CRUD di base, estese con query custom dove necessario (es. ricerca full-text tramite tsvector).
>
> **—** /service — contiene l'implementazione dei sei sottosistemi individuati nell'SDD (§3.1). Ciascun sottosistema è un pacchetto /gestioneXxx contenente obbligatoriamente la classe di servizio GestioneXxx (Facade verso il sottosistema) e, dove necessario, i sotto-pacchetti /dto (i Data Transfer Object del sottosistema), /exception (le eccezioni applicative specifiche) e /specific (implementazioni dedicate, es. /gestioneArticoli/specific/RicercaFullTextService o /gestioneUtenti/specific/CloudStorageService con le sue implementazioni S3CloudStorageService e CloudinaryCloudStorageService, secondo il pattern Strategy definito nell'SDD §3.2).
>
> **—** /web — i REST Controller, organizzati anch'essi per sottosistema (es. /web/utenti, /web/articoli), responsabili esclusivamente della validazione della richiesta, della delega al Service Layer e della serializzazione della risposta in DTO.
>
> **—** /utility — classi trasversali, suddivise in /constraints (validatori Bean Validation custom, es. @PasswordSicura, @EmailUnivoca) e /mapper (conversione DTO↔Entity).

Per ciascun sottosistema, le sezioni seguenti riportano gli invarianti di classe della relativa GestioneXxx (dove presenti) e i contratti — pre-condizioni e post-condizioni in notazione OCL — dei metodi che alterano lo stato del dominio. Per le operazioni di sola lettura (query) che non modificano lo stato del sistema si omette la specifica formale: il valore aggiunto di un contratto OCL è infatti massimo per le operazioni che mutano il dominio, mentre per le query la descrizione testuale è sufficiente a definirne il comportamento atteso.

> **2.1 GestioneUtenti**

**Invarianti** *self.utenti-\>forAll(u1, u2 \| u1 \<\> u2 implies u1.email \<\> u2.email) — l'indirizzo email è univoco tra tutti gli utenti registrati.*

**Attributi Utente** oltre ai campi già citati nei singoli contratti (email, stato, ruolo, tokenVerifica), l'implementazione corrente espone anche **dataRegistrazione** (Instant): impostato alla creazione dell'entità e mai più modificato in seguito; usato per l'ordinamento delle liste in searchUsers e getDeletionRequestsQueue (§2.5) e incluso nell'esportazione dati (RF1.10, RF4.7).

**Enumerazione StatoUtente** (set completo attualmente implementato)

> **—** NON_VERIFICATO — email non ancora confermata; stato di ingresso prodotto da registerUser.
>
> **—** ATTIVO — account pienamente operativo.
>
> **—** SOSPESO — sospensione amministrativa (RF4.3, UC_23, §2.5).
>
> **—** CANCELLATO — stato terminale raggiunto dopo l'elaborazione della richiesta di cancellazione (anonimizzazione irreversibile dei dati personali, RNF5.5, §2.5).

**Nota** Non esiste uno stato transitorio "in attesa di cancellazione" sull'utente. Il mockup 39_gestore_gestione_account.png mostra un badge/filtro "IN CANCELLAZIONE" sulla lista account, che una precedente versione di questa enumerazione modellava con un valore IN_CANCELLAZIONE — mai assegnato però da nessun metodo di GestioneUtenti/GestioneAmministrazioneUtenti (requestAccountDeletion crea solo una RichiestaCancellazione, non tocca Utente.stato), quindi rimosso in quanto dead code. L'informazione "richiesta di cancellazione in coda per questo utente" resta comunque disponibile senza duplicazione tramite RichiestaCancellazione (stato IN_CODA) — già la fonte usata da getUserManagementDashboard e getDeletionRequestsQueue (§2.5) — semplicemente non è (ancora) esposta come badge/filtro sulla lista account come nel mockup: scelta deliberata di non duplicare lo stato, non un'omissione.

**Nome metodo registerUser(dto: RegisterUserDTO)**

**Descrizione** Crea un nuovo Utente in stato NON_VERIFICATO e pubblica l'evento UtenteRegistrato per l'invio dell'email di verifica. (cfr. RF1.3, UC_1)

**Pre-condizioni**

> *context GestioneUtenti::registerUser(dto: RegisterUserDTO)*
>
> pre: not Utente.allInstances()-\>exists(u \| u.email = dto.email)
>
> and dto.consensoPrivacy = true

**Post-condizioni**

> *context GestioneUtenti::registerUser(dto: RegisterUserDTO)*
>
> post: Utente.allInstances()-\>exists(u \| u.email = dto.email and u.stato = StatoUtente::NON_VERIFICATO and u.ruolo = Ruolo::ISCRITTO)

**Nome metodo verifyEmail(token: String)**

**Descrizione** Attiva l'account a seguito del click sul link di verifica ricevuto via email. (cfr. RF1.3, UC_1)

**Pre-condizioni**

> *context GestioneUtenti::verifyEmail(token: String)*
>
> pre: Utente.allInstances()-\>exists(u \| u.tokenVerifica = token and u.stato = StatoUtente::NON_VERIFICATO)

**Post-condizioni**

> *context GestioneUtenti::verifyEmail(token: String)*
>
> post: Utente.allInstances()-\>select(u \| u.tokenVerifica = token).stato = StatoUtente::ATTIVO

**Nota**

\*authenticate(email, password) — il metodo non è implementato esplicitamente nel Service Layer: la verifica delle credenziali al login è delegata nativamente alla filter chain di Spring Security (cfr. RF1.4, UC_2).

**Nome metodo requestPasswordReset(email: String)**

**Descrizione** Genera un TokenRecuperoPassword monouso e pubblica l'evento per l'invio dell'email di recupero. (cfr. RF1.5, UC_3)

**Pre-condizioni**

> *context GestioneUtenti::requestPasswordReset(email: String)*
>
> pre: Utente.allInstances()-\>exists(u \| u.email = email and u.stato = StatoUtente::ATTIVO)

**Post-condizioni**

> *context GestioneUtenti::requestPasswordReset(email: String)*
>
> post: TokenRecuperoPassword.allInstances()-\>exists(t \| t.utente.email = email and t.utilizzato = false and t.dataScadenza \> now())

**Nome metodo resetPassword(token: String, dto: NewPasswordDTO)**

**Descrizione** Verifica il token e aggiorna la password cifrata dell'utente. (cfr. RF1.5, UC_3)

**Pre-condizioni**

> *context GestioneUtenti::resetPassword(token: String, dto: NewPasswordDTO)*
>
> pre: TokenRecuperoPassword.allInstances()-\>exists(t \| t.token = token and t.utilizzato = false and t.dataScadenza \> now())

**Post-condizioni**

> *context GestioneUtenti::resetPassword(token: String, dto: NewPasswordDTO)*
>
> post: TokenRecuperoPassword.allInstances()-\>select(t \| t.token = token).utilizzato = true
>
> and self.utenti-\>select(u \| u.tokenRecuperoPassword.token = token).passwordHash \<\> passwordHash@pre

**Nome metodo updateProfile(userId: Long, dto: UpdateProfileDTO)**

**Descrizione** Aggiorna dati anagrafici, foto profilo e biografia. (cfr. RF1.6, UC_4)

**Pre-condizioni**

> *context GestioneUtenti::updateProfile(userId: Long, dto: UpdateProfileDTO)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId)
>
> and dto.biografia.size() \<= 1000

**Post-condizioni**

> *context GestioneUtenti::updateProfile(userId: Long, dto: UpdateProfileDTO)*
>
> post: Utente.allInstances()-\>select(u \| u.id = userId).biografia = dto.biografia

**Metodi di sola lettura**

|                          |                                                                       |
|--------------------------|-----------------------------------------------------------------------|
| **Metodo (query)**       | **Descrizione**                                                       |
| getPublicProfile(userId) | Recupera i dati pubblici del profilo di un altro utente. (cfr. RF1.9) |

**Nome metodo requestAccountDataExport(userId: Long)**

**Descrizione** Genera l'esportazione self-service dei propri dati personali in formato JSON. (cfr. RF1.10)

**Pre-condizioni**

> *context GestioneUtenti::requestAccountDataExport(userId: Long)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId and u.stato = StatoUtente::ATTIVO)

**Post-condizioni**

> *context GestioneUtenti::requestAccountDataExport(userId: Long)*
>
> post: -- pubblica l'evento DataExportReady consumato da GestioneNotifiche (cfr. SDD §3.5)

**Nome metodo requestAccountDeletion(userId: Long)**

**Descrizione** Crea una RichiestaCancellazione in stato IN_CODA, che confluisce nella coda di lavorazione del Gestore Utenti (diritto all'oblio). (cfr. RF1.10, UC_25)

**Pre-condizioni**

> *context GestioneUtenti::requestAccountDeletion(userId: Long)*
>
> pre: not RichiestaCancellazione.allInstances()-\>exists(r \| r.utente.id = userId and r.stato \<\> StatoRichiestaCancellazione::RESPINTA)

**Post-condizioni**

> *context GestioneUtenti::requestAccountDeletion(userId: Long)*
>
> post: RichiestaCancellazione.allInstances()-\>exists(r \| r.utente.id = userId and r.stato = StatoRichiestaCancellazione::IN_CODA)

**Nome metodo reportUser(reporterId: Long, dto: ReportUserDTO)**

**Descrizione** Crea una Segnalazione e la inoltra alla coda di lavorazione del Gestore Utenti. (cfr. RF1.9, UC_26)

**Pre-condizioni**

> *context GestioneUtenti::reportUser(reporterId: Long, dto: ReportUserDTO)*
>
> pre: reporterId \<\> dto.segnalatoId
>
> and dto.motivazione.size() \> 0

**Post-condizioni**

> *context GestioneUtenti::reportUser(reporterId: Long, dto: ReportUserDTO)*
>
> post: Segnalazione.allInstances()-\>exists(s \| s.segnalante.id = reporterId and s.segnalato.id = dto.segnalatoId and s.stato = StatoSegnalazione::APERTA)
>
> **2.2 GestioneArticoli**

**Invarianti** *self.articoli-\>select(a \| a.stato = StatoArticolo::PUBBLICATO)-\>forAll(a \| not a.categoria.oclIsUndefined()) — un articolo pubblicato deve appartenere a una categoria.*

**Nota (ownership)** updateDraft, publishArticle, updatePublishedArticle, deleteDraft e deleteArticle accettano tutti un parametro callerId (il chiamante autenticato) oltre all'id dell'articolo, e condividono lo stesso vincolo, non altrimenti derivabile dai soli ruoli RBAC (@PreAuthorize verifica solo "è un Autore o un Manager Autori", non "è l'autore *di questo articolo*"): solo l'autore proprietario dell'articolo o un utente con ruolo MANAGER_AUTORI può operare su di esso, altrimenti AutoreNonValidoException. Per non ripeterlo identico cinque volte, le pre-condizioni seguenti lo esprimono con la clausola comune `and (a.autore.id = callerId or Utente.allInstances()->exists(u | u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI))`.

**Nome metodo createDraft(authorId: Long, dto: ArticleDraftDTO)**

**Descrizione** Crea un nuovo articolo in stato BOZZA. (cfr. RF2.7, UC_16)

**Pre-condizioni**

> *context GestioneArticoli::createDraft(authorId: Long, dto: ArticleDraftDTO)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = authorId and (u.ruolo = Ruolo::AUTORE or u.ruolo = Ruolo::MANAGER_AUTORI))

**Post-condizioni**

> *context GestioneArticoli::createDraft(authorId: Long, dto: ArticleDraftDTO)*
>
> post: Articolo.allInstances()-\>exists(a \| a.autore.id = authorId and a.stato = StatoArticolo::BOZZA)

**Nome metodo updateDraft(draftId: Long, callerId: Long, dto: ArticleDraftDTO)**

**Descrizione** Aggiorna una bozza esistente, ripristinando l'editor allo stato salvato. (cfr. RF2.7, UC_17)

**Pre-condizioni**

> *context GestioneArticoli::updateDraft(draftId: Long, callerId: Long, dto: ArticleDraftDTO)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = draftId and a.stato = StatoArticolo::BOZZA
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::updateDraft(draftId: Long, callerId: Long, dto: ArticleDraftDTO)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = draftId).titolo = dto.titolo

**Nome metodo publishArticle(articleId: Long, callerId: Long)**

**Descrizione** Porta l'articolo dallo stato BOZZA a IN_ATTESA_APPROVAZIONE. (cfr. RF2.2, UC_15, UC_17)

**Pre-condizioni**

> *context GestioneArticoli::publishArticle(articleId: Long, callerId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::BOZZA and not a.titolo.oclIsUndefined() and not a.categoria.oclIsUndefined()
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::publishArticle(articleId: Long, callerId: Long)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = articleId).stato = StatoArticolo::IN_ATTESA_APPROVAZIONE

**Nome metodo updatePublishedArticle(articleId: Long, callerId: Long, dto: ArticleUpdateDTO)**

**Descrizione** Corregge un articolo già pubblicato; le modifiche sono immediatamente visibili. (cfr. RF2.3, UC_20)

**Pre-condizioni**

> *context GestioneArticoli::updatePublishedArticle(articleId: Long, callerId: Long, dto: ArticleUpdateDTO)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::PUBBLICATO
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::updatePublishedArticle(articleId: Long, callerId: Long, dto: ArticleUpdateDTO)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = articleId).testo = dto.testo
>
> and self.articoli-\>select(a \| a.id = articleId).stato = StatoArticolo::PUBBLICATO

**Nome metodo deleteDraft(draftId: Long, callerId: Long)**

**Descrizione** Elimina definitivamente una bozza. (cfr. RF2.7, UC_18)

**Pre-condizioni**

> *context GestioneArticoli::deleteDraft(draftId: Long, callerId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = draftId and a.stato = StatoArticolo::BOZZA
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::deleteDraft(draftId: Long, callerId: Long)*
>
> post: not Articolo.allInstances()-\>exists(a \| a.id = draftId)

**Nome metodo deleteArticle(articleId: Long, callerId: Long)**

**Descrizione** Elimina definitivamente un articolo pubblicato. (cfr. RF2.4, UC_19)

**Pre-condizioni**

> *context GestioneArticoli::deleteArticle(articleId: Long, callerId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::PUBBLICATO
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::deleteArticle(articleId: Long, callerId: Long)*
>
> post: not Articolo.allInstances()-\>exists(a \| a.id = articleId)

**Nome metodo saveArticleToList(userId: Long, articleId: Long, tipo: TipoLista)**

**Descrizione** Aggiunge un articolo a “Preferiti” o “Leggi più tardi”. (cfr. RF1.7, UC_6)

**Pre-condizioni**

> *context GestioneArticoli::saveArticleToList(userId: Long, articleId: Long, tipo: TipoLista)*
>
> pre: not ArticoloSalvato.allInstances()-\>exists(s \| s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo)

**Post-condizioni**

> *context GestioneArticoli::saveArticleToList(userId: Long, articleId: Long, tipo: TipoLista)*
>
> post: ArticoloSalvato.allInstances()-\>exists(s \| s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo)

**Nome metodo removeArticleFromList(userId: Long, articleId: Long, tipo: TipoLista)**

**Descrizione** Rimuove un articolo da una lista personale. (cfr. RF1.7, UC_7)

**Pre-condizioni**

> *context GestioneArticoli::removeArticleFromList(userId: Long, articleId: Long, tipo: TipoLista)*
>
> pre: ArticoloSalvato.allInstances()-\>exists(s \| s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo)

**Post-condizioni**

> *context GestioneArticoli::removeArticleFromList(userId: Long, articleId: Long, tipo: TipoLista)*
>
> post: not ArticoloSalvato.allInstances()-\>exists(s \| s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo)

**Metodi di sola lettura**

|                               |                                                                                             |
|-------------------------------|---------------------------------------------------------------------------------------------|
| **Metodo (query)**            | **Descrizione**                                                                             |
| searchArticles(criteria)      | Ricerca full-text (PostgreSQL tsvector/GIN) combinata con filtri di categoria. (cfr. RF1.2) |
| getArticleById(articleId)     | Recupera il dettaglio di un articolo pubblicato. (cfr. RF1.1)                               |
| getArticlesByAuthor(authorId) | Recupera gli articoli (pubblicati e bozze) di un autore. (cfr. RF2.1)                       |
| getSavedArticles(userId)      | Recupera la sezione “I miei salvataggi”. (cfr. RF1.8, UC_7)                                 |

> **2.3 GestioneCategorie**

**Invarianti** *not Categoria.allInstances()-\>exists(c \| c.categoriaPadre = c) — una categoria non può essere padre di sé stessa (assenza di cicli diretti nella gerarchia).*

**Nome metodo createCategory(dto: CategoryDTO)**

**Descrizione** Crea una nuova categoria specificando nome, categoria padre e descrizione. (cfr. RF2.5, UC_12)

**Pre-condizioni**

> *context GestioneCategorie::createCategory(dto: CategoryDTO)*
>
> pre: not Categoria.allInstances()-\>exists(c \| c.nome = dto.nome and c.categoriaPadre.id = dto.categoriaPadreId)

**Post-condizioni**

> *context GestioneCategorie::createCategory(dto: CategoryDTO)*
>
> post: Categoria.allInstances()-\>exists(c \| c.nome = dto.nome and c.categoriaPadre.id = dto.categoriaPadreId)

**Nome metodo updateCategory(categoryId: Long, dto: CategoryDTO)**

**Descrizione** Modifica il testo descrittivo di una categoria esistente. (cfr. RF2.6, UC_14)

**Pre-condizioni**

> *context GestioneCategorie::updateCategory(categoryId: Long, dto: CategoryDTO)*
>
> pre: Categoria.allInstances()-\>exists(c \| c.id = categoryId)
>
> and dto.nome.size() \> 0

**Post-condizioni**

> *context GestioneCategorie::updateCategory(categoryId: Long, dto: CategoryDTO)*
>
> post: Categoria.allInstances()-\>select(c \| c.id = categoryId).descrizione = dto.descrizione

**Nome metodo deleteCategory(categoryId: Long, dto: ReassignCategoryDTO)**

**Descrizione** Elimina una categoria obsoleta o duplicata, riassegnando gli articoli “orfani” alla categoria indicata. (cfr. RF3.5, UC_13)

**Pre-condizioni**

> *context GestioneCategorie::deleteCategory(categoryId: Long, dto: ReassignCategoryDTO)*
>
> pre: Categoria.allInstances()-\>exists(c \| c.id = categoryId)
>
> and Categoria.allInstances()-\>exists(c \| c.id = dto.categoriaDestinazioneId and c.id \<\> categoryId)

**Post-condizioni**

> *context GestioneCategorie::deleteCategory(categoryId: Long, dto: ReassignCategoryDTO)*
>
> post: not Categoria.allInstances()-\>exists(c \| c.id = categoryId)
>
> and Articolo.allInstances()-\>select(a \| a.categoria.id@pre = categoryId).forAll(a \| a.categoria.id = dto.categoriaDestinazioneId)

**Metodi di sola lettura**

|                             |                                                                                        |
|-----------------------------|----------------------------------------------------------------------------------------|
| **Metodo (query)**          | **Descrizione**                                                                        |
| getCategoryTree()           | Recupera l'albero gerarchico completo delle categorie per la navigazione. (cfr. RF1.2) |
| getCategoryById(categoryId) | Recupera i dettagli di una singola categoria.                                          |

> **2.4 GestioneAutori**

**Invarianti** *not InvitoAutore.allInstances()-\>exists(i1, i2 \| i1 \<\> i2 and i1.email = i2.email and i1.stato = StatoInvito::INVIATO and i2.stato = StatoInvito::INVIATO) — non possono coesistere due inviti attivi per lo stesso indirizzo email.*

**Nome metodo inviteAuthor(dto: InviteAuthorDTO)**

**Descrizione** Crea un InvitoAutore e pubblica l'evento per l'invio dell'email di invito. (cfr. RF3.3, UC_8, UC_9)

**Pre-condizioni**

> *context GestioneAutori::inviteAuthor(dto: InviteAuthorDTO)*
>
> pre: not InvitoAutore.allInstances()-\>exists(i \| i.email = dto.email and i.stato = StatoInvito::INVIATO)

**Post-condizioni**

> *context GestioneAutori::inviteAuthor(dto: InviteAuthorDTO)*
>
> post: InvitoAutore.allInstances()-\>exists(i \| i.email = dto.email and i.stato = StatoInvito::INVIATO and i.ruoloProposto = dto.ruolo)

**Nome metodo acceptInvite(token: String, dto: SetPasswordDTO)**

**Descrizione** Registra l'accettazione dell'invito: crea l'account Utente con il ruolo proposto e imposta la password scelta dall'invitato. (cfr. UC_10)

**Pre-condizioni**

> *context GestioneAutori::acceptInvite(token: String, dto: SetPasswordDTO)*
>
> pre: InvitoAutore.allInstances()-\>exists(i \| i.token = token and i.stato = StatoInvito::INVIATO and i.dataScadenza \> now())

**Post-condizioni**

> *context GestioneAutori::acceptInvite(token: String, dto: SetPasswordDTO)*
>
> post: InvitoAutore.allInstances()-\>select(i \| i.token = token).stato = StatoInvito::ACCETTATO
>
> and Utente.allInstances()-\>exists(u \| u.email = self.invitoAutore(token).email and u.stato = StatoUtente::ATTIVO)

**Nome metodo declineInvite(token: String)**

**Descrizione** Registra il rifiuto dell'invito da parte del destinatario, senza creare alcun account. (cfr. UC_10)

**Pre-condizioni**

> *context GestioneAutori::declineInvite(token: String)*
>
> pre: InvitoAutore.allInstances()-\>exists(i \| i.token = token and i.stato = StatoInvito::INVIATO)

**Post-condizioni**

> *context GestioneAutori::declineInvite(token: String)*
>
> post: InvitoAutore.allInstances()-\>select(i \| i.token = token).stato = StatoInvito::RIFIUTATO

**Nome metodo removeAuthor(authorId: Long, dto: RemoveAuthorPolicyDTO)**

**Descrizione** Revoca i permessi di un autore, con opzione di mantenere o eliminare i suoi articoli pregressi. (cfr. RF3.4, UC_11)

**Pre-condizioni**

> *context GestioneAutori::removeAuthor(authorId: Long, dto: RemoveAuthorPolicyDTO)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = authorId and u.ruolo = Ruolo::AUTORE)

**Post-condizioni**

> *context GestioneAutori::removeAuthor(authorId: Long, dto: RemoveAuthorPolicyDTO)*
>
> post: not Utente.allInstances()-\>exists(u \| u.id = authorId and u.ruolo = Ruolo::AUTORE)
>
> and dto.mantieniArticoli or not Articolo.allInstances()-\>exists(a \| a.autore.id = authorId)

**Nome metodo approveArticle(articleId: Long)**

**Descrizione** Approva un articolo, rendendolo visibile pubblicamente. (cfr. RF3.6, UC_21)

**Pre-condizioni**

> *context GestioneAutori::approveArticle(articleId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::IN_ATTESA_APPROVAZIONE)

**Post-condizioni**

> *context GestioneAutori::approveArticle(articleId: Long)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = articleId).stato = StatoArticolo::PUBBLICATO

**Nome metodo rejectArticle(articleId: Long, dto: RejectionReasonDTO)**

**Descrizione** Rifiuta un articolo, notificando l'autore con la motivazione. (cfr. RF3.6, UC_21)

**Pre-condizioni**

> *context GestioneAutori::rejectArticle(articleId: Long, dto: RejectionReasonDTO)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::IN_ATTESA_APPROVAZIONE)
>
> and dto.motivazione.size() \> 0

**Post-condizioni**

> *context GestioneAutori::rejectArticle(articleId: Long, dto: RejectionReasonDTO)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = articleId).stato = StatoArticolo::RIFIUTATO

**Metodi di sola lettura**

|                            |                                                                                           |
|----------------------------|-------------------------------------------------------------------------------------------|
| **Metodo (query)**         | **Descrizione**                                                                           |
| listAuthors()              | Recupera la lista completa degli autori attuali. (cfr. RF3.2, UC_8)                       |
| getPendingArticles()       | Recupera la coda degli articoli in attesa di approvazione. (cfr. RF3.1, UC_21)            |
| getManagerDashboardStats() | Recupera le statistiche (es. andamento visite) per la Dashboard Manageriale. (cfr. RF3.1) |

Nota di collaborazione tra sottosistemi: acceptInvite crea un nuovo record Utente, un'operazione concettualmente di competenza di GestioneUtenti. La responsabilità resta in GestioneAutori — coerentemente con il servizio elencato nell'SDD (§4.4) — poiché l'operazione è indissolubilmente legata al ciclo di vita dell'InvitoAutore; il metodo delega comunque la creazione dell'entità Utente al repository condiviso, senza duplicare logica di validazione già presente in GestioneUtenti.registerUser.

> **2.5 GestioneAmministrazioneUtenti**

**Invarianti** *not RichiestaCancellazione.allInstances()-\>exists(r1, r2 \| r1 \<\> r2 and r1.utente = r2.utente and r1.stato = StatoRichiestaCancellazione::IN_CODA and r2.stato = StatoRichiestaCancellazione::IN_CODA) — un utente non può avere più di una richiesta di cancellazione attiva contemporaneamente.*

**Nome metodo suspendAccount(userId: Long, dto: SuspensionDTO)**

**Descrizione** Sospende un account specificando motivazione e durata; pubblica l'evento di notifica. (cfr. RF4.3, UC_23)

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::suspendAccount(userId: Long, dto: SuspensionDTO)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId and u.stato = StatoUtente::ATTIVO)
>
> and dto.motivazione.size() \> 0

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::suspendAccount(userId: Long, dto: SuspensionDTO)*
>
> post: Utente.allInstances()-\>select(u \| u.id = userId).stato = StatoUtente::SOSPESO
>
> and LogAzioneAmministrativa.allInstances()-\>exists(l \| l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::SOSPENSIONE)

**Nome metodo reactivateAccount(userId: Long)**

**Descrizione** Riattiva un account precedentemente sospeso. (cfr. RF4.4, UC_24)

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::reactivateAccount(userId: Long)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId and u.stato = StatoUtente::SOSPESO)

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::reactivateAccount(userId: Long)*
>
> post: Utente.allInstances()-\>select(u \| u.id = userId).stato = StatoUtente::ATTIVO
>
> and LogAzioneAmministrativa.allInstances()-\>exists(l \| l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::RIATTIVAZIONE)

**Nome metodo resolveReport(reportId: Long, dto: ReportResolutionDTO)**

**Descrizione** Archivia, richiede modifica o scala a sospensione una segnalazione. (cfr. RF4.5, UC_26)

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::resolveReport(reportId: Long, dto: ReportResolutionDTO)*
>
> pre: Segnalazione.allInstances()-\>exists(s \| s.id = reportId and (s.stato = StatoSegnalazione::APERTA or s.stato = StatoSegnalazione::IN_GESTIONE))

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::resolveReport(reportId: Long, dto: ReportResolutionDTO)*
>
> post: Segnalazione.allInstances()-\>select(s \| s.id = reportId).stato = dto.nuovoStato

**Nome metodo processAccountDeletion(requestId: Long)**

**Descrizione** Verifica i prerequisiti e conferma l'elaborazione della cancellazione (diritto all'oblio). (cfr. RF4.6, UC_25)

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::processAccountDeletion(requestId: Long)*
>
> pre: RichiestaCancellazione.allInstances()-\>exists(r \| r.id = requestId and r.stato = StatoRichiestaCancellazione::IN_CODA)
>
> and not Articolo.allInstances()-\>exists(a \| a.autore = self.richiesta(requestId).utente and a.stato = StatoArticolo::IN_ATTESA_APPROVAZIONE)

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::processAccountDeletion(requestId: Long)*
>
> post: RichiestaCancellazione.allInstances()-\>select(r \| r.id = requestId).stato = StatoRichiestaCancellazione::COMPLETATA
>
> and self.richiesta(requestId)@pre.utente.stato = StatoUtente::CANCELLATO
>
> and LogAzioneAmministrativa.allInstances()-\>exists(l \| l.utenteTarget.id = self.richiesta(requestId)@pre.utente.id and l.tipoAzione = TipoAzioneAmministrativa::CANCELLAZIONE)

**Nota** A differenza di una precedente versione di questo contratto, la post-condizione non afferma più `not Utente.allInstances()->exists(...)`: l'implementazione (Utente.anonimizza()) non rimuove la riga, la anonimizza (nome, cognome, email, passwordHash, fotoProfilo, biografia sovrascritti; stato → CANCELLATO), perché segnalazioni, richieste di cancellazione e cronologia amministrativa (RF4.8) referenziano utenti.id con FK non nullable e nessun ON DELETE CASCADE in nessuna migrazione esistente — un hard delete violerebbe l'integrità referenziale e distruggerebbe proprio la cronologia che RF4.8 richiede di conservare. RNF5.5 ammette esplicitamente sia l'eliminazione sia l'anonimizzazione irreversibile come modi per soddisfare il diritto all'oblio; qui è stata scelta la seconda. Stessa logica pragmatica di GestioneAutori.removeAuthor (§2.4), la cui post-condizione resta invece corretta così com'è perché qualificata sul ruolo (`u.ruolo = Ruolo::AUTORE`), non sull'identità dell'oggetto.

**Nome metodo exportUserDataAssisted(userId: Long)**

**Descrizione** Genera e invia, previa verifica dell'identità, l'esportazione assistita dei dati personali. (cfr. RF4.7, UC_27)

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::exportUserDataAssisted(userId: Long)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId)

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::exportUserDataAssisted(userId: Long)*
>
> post: LogAzioneAmministrativa.allInstances()-\>exists(l \| l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::ESPORTAZIONE)

**Metodi di sola lettura**

|                                     |                                                                                                       |
|-------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Metodo (query)**                  | **Descrizione**                                                                                       |
| getUserManagementDashboard()        | Recupera numero utenti registrati, segnalazioni aperte e richieste GDPR in coda. (cfr. RF4.1)         |
| searchUsers(criteria)               | Ricerca, filtra e restituisce la lista degli utenti registrati con stato account. (cfr. RF4.2, UC_22) |
| getReportsQueue()                   | Recupera la coda di lavorazione delle segnalazioni ricevute dagli utenti. (cfr. RF4.5, UC_26)         |
| getDeletionRequestsQueue()          | Recupera la coda delle richieste di cancellazione account. (cfr. RF4.6, UC_25)                        |
| getAdministrativeActionLog(filters) | Recupera la cronologia consultabile delle azioni amministrative. (cfr. RF4.8)                         |

> **2.6 GestioneNotifiche**

**Invarianti** *Non sono presenti invarianti: il sottosistema non possiede uno stato persistente proprio, ma reagisce esclusivamente agli eventi di dominio pubblicati dagli altri sottosistemi (cfr. SDD §3.5).*

I contratti seguenti sono espressi in forma sintetica, in quanto ciascun listener reagisce a un evento già validato dal sottosistema che lo pubblica: la pre-condizione comune a tutti è la ricezione dell'evento sull'event bus, la post-condizione è l'invio dell'email corrispondente.

**Nome metodo onUserRegistered(evt: UtenteRegistratoEvent)**

**Descrizione** Invia l'email di verifica dell'indirizzo. (cfr. UC_1)

> pre: evento UtenteRegistratoEvent pubblicato
>
> post: email di verifica inviata all'indirizzo evt.email

**Nome metodo onPasswordResetRequested(evt: PasswordResetRequestedEvent)**

**Descrizione** Invia l'email con il link sicuro di recupero password. (cfr. UC_3)

> pre: evento PasswordResetRequestedEvent pubblicato
>
> post: email con link di recupero inviata

**Nome metodo onAuthorInvited(evt: AutoreInvitatoEvent)**

**Descrizione** Invia l'email di invito con il link per la registrazione. (cfr. UC_9)

> pre: evento AutoreInvitatoEvent pubblicato
>
> post: email di invito inviata all'indirizzo evt.email

**Nome metodo onArticleReviewed(evt: ArticoloRecensitoEvent)**

**Descrizione** Notifica l'autore dell'approvazione o del rifiuto dell'articolo. (cfr. UC_21)

> pre: evento ArticoloRecensitoEvent pubblicato
>
> post: email di esito inviata all'autore dell'articolo

**Nome metodo onAccountSuspended(evt: AccountSospesoEvent)**

**Descrizione** Notifica l'utente della sospensione, motivazione e modalità di ricorso. (cfr. RF4.3, UC_23)

> pre: evento AccountSospesoEvent pubblicato
>
> post: email di sospensione inviata

**Nome metodo onAccountReactivated(evt: AccountRiattivatoEvent)**

**Descrizione** Notifica l'utente della riattivazione dell'account. (cfr. UC_24)

> pre: evento AccountRiattivatoEvent pubblicato
>
> post: email di riattivazione inviata

**Nome metodo onReportResolutionRequested(evt: RichiestaModificaProfiloEvent)**

**Descrizione** Notifica l'utente segnalato della richiesta di modifica del profilo. (cfr. UC_26)

> pre: evento RichiestaModificaProfiloEvent pubblicato
>
> post: email di richiesta modifica inviata

**Nome metodo onDataExportReady(evt: DataExportReadyEvent)**

**Descrizione** Invia il link sicuro e a scadenza per il download dei dati esportati. (cfr. RF1.10, RF4.7)

> pre: evento DataExportReadyEvent pubblicato
>
> post: email con link di download (one-time, RNF9.3) inviata

**Nome metodo onBruteForceLockout(evt: BruteForceLockoutEvent)**

**Descrizione** Invia l'email di conferma per lo sblocco dopo un blocco per tentativi falliti. (cfr. RNF2.6)

> pre: evento BruteForceLockoutEvent pubblicato
>
> post: email di conferma sblocco inviata
