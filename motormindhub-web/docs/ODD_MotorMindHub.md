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

> **—** /config — classi di configurazione dichiarativa: SecurityConfig (filter chain JWT e regole RBAC), OpenApiConfig (documentazione Swagger, cfr. RNF4.2), AsyncConfig (thread pool per i listener di eventi), CorsConfig, CloudinaryConfig (costruisce e valida il client del provider di Cloud Storage, cfr. /service/storage sotto - fail-fast se le credenziali mancano, nessun default insicuro).
>
> **—** /security — componenti dedicati all'autenticazione stateless: JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl. Separato da /config per isolare la logica di sicurezza pura dalla sua configurazione dichiarativa.
>
> **—** /events — le classi degli eventi di dominio (es. UtenteRegistratoEvent, ArticoloRecensitoEvent, AccountSospesoEvent) pubblicate dal Service Layer, e i relativi listener asincroni: costituiscono l'implementazione del meccanismo di Global Software Control descritto nell'SDD (§3.5).
>
> **—** /model — contiene: 1) /entity, le classi persistenti che mappano le tabelle del database tramite JPA, con le relative enumerazioni di stato; 2) /repository, le interfacce Spring Data JPA che forniscono le operazioni CRUD di base, estese con query custom dove necessario (es. ricerca full-text tramite tsvector).
>
> **—** /service — contiene l'implementazione dei sei sottosistemi individuati nell'SDD (§3.1). Ciascun sottosistema è un pacchetto /gestioneXxx contenente obbligatoriamente la classe di servizio GestioneXxx (Facade verso il sottosistema) e, dove necessario, i sotto-pacchetti /dto (i Data Transfer Object del sottosistema), /exception (le eccezioni applicative specifiche) e /specific (implementazioni dedicate al singolo sottosistema, es. /gestioneArticoli/specific/RicercaFullTextService).
>
> **—** /service/storage — **correzione**: una versione precedente di questo documento collocava CloudStorageService (e le sue implementazioni) sotto /gestioneUtenti/specific, coerentemente con l'uso originario per le sole foto profilo. L'SDD (§3.2) lo indica pero' come condiviso anche da GestioneArticoli (immagini di copertina): un sottoservizio annidato sotto lo /specific di un solo sottosistema violerebbe l'isolamento tra sottosistemi che questo stesso documento adotta altrove. CloudStorageService (interfaccia, pattern Strategy) e ImageUploadValidator (validazione dimensione/formato/contenuto, condivisa e indipendente dal provider) vivono quindi in un pacchetto cross-cutting proprio, allo stesso livello di /security o /events. Unica implementazione reale: CloudinaryStorageService (provider Cloudinary).
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

**Descrizione** Attiva l'account a seguito del click sul link di verifica ricevuto via email. Il token ha una scadenza di 24 ore dalla registrazione (RNF9.3, allineata al testo dell'email di verifica e alla scadenza gia' applicata a TokenRecuperoPassword): se scaduto viene sollevata TokenVerificaScadutoException, distinta da TokenNonValidoException (token inesistente o account gia' verificato) per permettere in futuro un flusso di reinvio dedicato. (cfr. RF1.3, UC_1)

**Pre-condizioni**

> *context GestioneUtenti::verifyEmail(token: String)*
>
> pre: Utente.allInstances()-\>exists(u \| u.tokenVerifica = token and u.stato = StatoUtente::NON_VERIFICATO and u.dataScadenzaTokenVerifica \> now())

**Post-condizioni**

> *context GestioneUtenti::verifyEmail(token: String)*
>
> post: Utente.allInstances()-\>select(u \| u.tokenVerifica = token).stato = StatoUtente::ATTIVO

**Nota**

\*authenticate(email, password) — il metodo non è implementato esplicitamente nel Service Layer: la verifica delle credenziali al login è delegata nativamente alla filter chain di Spring Security (cfr. RF1.4, UC_2).

**Post-condizione aggiuntiva su login riuscito (RF3.1, UC_28)** Oltre all'emissione di access/refresh token, `AuthController::login` invoca direttamente `GestioneAmministrazioneUtenti::riclassificaComeIscritto(sessioneIdCookie)` (§2.5) leggendo il cookie anonimo mmh\_visit\_session dalla richiesta HTTP:

> *context AuthController::login(dto: LoginRequestDTO, sessioneIdCookie: String)*
>
> post: (sessioneIdCookie \<\> null and VisitaSessione.allInstances()@pre-\>exists(v \| v.sessioneId = sessioneIdCookie and v.tipo = TipoVisitatore::GUEST)) implies VisitaSessione.allInstances()-\>select(v \| v.sessioneId = sessioneIdCookie)-\>first().tipo = TipoVisitatore::ISCRITTO
>
> and VisitaSessione.allInstances()-\>size() = VisitaSessione.allInstances()@pre-\>size() — nessuna nuova riga, solo eventuale riclassificazione di una gia' esistente

Chiamata diretta, non tramite evento di dominio: la lettura del cookie è un artefatto della richiesta HTTP corrente, non un dato che un evento di dominio (che qui trasporta solo id/email utente, cfr. gli eventi in `events/`) potrebbe naturalmente veicolare, e login non passa già dal Service Layer (nota sopra) — un evento pubblicato da un Controller introdurrebbe una seconda eccezione architetturale invece di riusarne una già esistente e circoscritta. Motivazione completa nella javadoc di `GestioneAmministrazioneUtenti::riclassificaComeIscritto`.

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

**Descrizione** Aggiorna dati anagrafici, foto profilo e biografia. Se fotoProfilo cambia rispetto al valore precedente, il vecchio file viene eliminato da Cloud Storage (best-effort, CloudStorageService.delete - cfr. uploadFotoProfilo sotto), per non accumulare asset orfani a ogni sostituzione dell'avatar. (cfr. RF1.6, UC_4, SDD 3.2)

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
>
> and Utente.allInstances()-\>select(u \| u.id = userId).fotoProfilo = dto.fotoProfilo

**Nome metodo uploadFotoProfilo(file: MultipartFile)**

**Descrizione** Carica un'immagine su Cloud Storage (CloudStorageService, pattern Strategy - SDD 3.2, implementazione corrente CloudinaryStorageService/Cloudinary) e ne restituisce l'URL pubblico. Non tocca Utente: il chiamante deve poi passare l'URL a updateProfile per persisterlo - un'immagine caricata ma mai associata a un profilo (upload interrotto prima del salvataggio) resta un file orfano su Cloud Storage, accettato come costo residuo non coperto da questo contratto. Validazione (ImageUploadValidator, condivisa con GestioneArticoli::uploadImmagineCopertina): formato in whitelist (JPEG/PNG/WEBP), dimensione massima 2MB, contenuto verificato come immagine reale via decodifica (non il solo Content-Type dichiarato, falsificabile). (SDD 3.2)

**Pre-condizioni**

> *context GestioneUtenti::uploadFotoProfilo(file: MultipartFile)*
>
> pre: file.oclIsUndefined() = false and file.size \<= 2097152
>
> and Set{'image/jpeg', 'image/png', 'image/webp'}-\>includes(file.contentType)

**Post-condizioni**

> *context GestioneUtenti::uploadFotoProfilo(file: MultipartFile)*
>
> post: result = -- URL pubblico del file appena caricato su Cloud Storage

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

**Nota (ownership)** updateDraft, publishArticle, reopenRejectedArticle, updatePublishedArticle, deleteDraft e deleteArticle accettano tutti un parametro callerId (il chiamante autenticato) oltre all'id dell'articolo, e condividono lo stesso vincolo, non altrimenti derivabile dai soli ruoli RBAC (@PreAuthorize verifica solo "è un Autore o un Manager Autori", non "è l'autore *di questo articolo*"): solo l'autore proprietario dell'articolo o un utente con ruolo MANAGER_AUTORI può operare su di esso, altrimenti AutoreNonValidoException. Per non ripeterlo identico sei volte, le pre-condizioni seguenti lo esprimono con la clausola comune `and (a.autore.id = callerId or Utente.allInstances()->exists(u | u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI))`.

**Nome metodo uploadImmagineCopertina(file: MultipartFile)**

**Descrizione** Carica un'immagine su Cloud Storage (CloudStorageService, pattern Strategy - SDD 3.2) e ne restituisce l'URL pubblico. Non lega l'upload a un articolo/bozza esistente (l'editor supporta un articolo non ancora creato, senza id): il chiamante deve poi passare l'URL a createDraft/updateDraft/updatePublishedArticle. Validazione (ImageUploadValidator, condivisa con GestioneUtenti::uploadFotoProfilo): formato in whitelist (JPEG/PNG/WEBP), dimensione massima 5MB (piu' permissiva della foto profilo: e' un'immagine hero, non un avatar), contenuto verificato come immagine reale via decodifica. Sostituisce il precedente campo URL libero dell'editor: l'immagine di copertina e' ora raggiungibile solo tramite questo endpoint, non piu' testo arbitrario incollato dall'autore (altrimenti la validazione qui descritta sarebbe aggirabile). (SDD 3.2)

**Pre-condizioni**

> *context GestioneArticoli::uploadImmagineCopertina(file: MultipartFile)*
>
> pre: file.oclIsUndefined() = false and file.size \<= 5242880
>
> and Set{'image/jpeg', 'image/png', 'image/webp'}-\>includes(file.contentType)

**Post-condizioni**

> *context GestioneArticoli::uploadImmagineCopertina(file: MultipartFile)*
>
> post: result = -- URL pubblico del file appena caricato su Cloud Storage

**Nome metodo uploadImmagineCorpoArticolo(file: MultipartFile)**

**Descrizione** Carica un'immagine su Cloud Storage per l'uso INLINE nel corpo Markdown dell'articolo (Articolo.testo), non come copertina. Stessa validazione di uploadImmagineCopertina (ImageUploadValidator: formato JPEG/PNG/WEBP, dimensione massima 5MB, contenuto verificato come immagine reale via decodifica) e stessi ruoli autorizzati (AUTORE, MANAGER_AUTORI) - l'unica differenza e' la cartella di destinazione su Cloud Storage (separata dalla copertina, cosi' da non mischiare le due categorie nel media library del provider). Come uploadImmagineCopertina, non lega l'upload a un articolo/bozza esistente e non tocca Articolo: il chiamante incolla l'URL restituito nel Markdown di dto.testo e lo persiste passando l'intero testo a createDraft/updateDraft/updatePublishedArticle. (SDD 3.2)

**Pre-condizioni**

> *context GestioneArticoli::uploadImmagineCorpoArticolo(file: MultipartFile)*
>
> pre: file.oclIsUndefined() = false and file.size \<= 5242880
>
> and Set{'image/jpeg', 'image/png', 'image/webp'}-\>includes(file.contentType)

**Post-condizioni**

> *context GestioneArticoli::uploadImmagineCorpoArticolo(file: MultipartFile)*
>
> post: result = -- URL pubblico del file appena caricato su Cloud Storage

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

**Descrizione** Aggiorna una bozza esistente, ripristinando l'editor allo stato salvato. Se immagineCopertina cambia rispetto al valore precedente, il vecchio file viene eliminato da Cloud Storage (best-effort, CloudStorageService.delete - cfr. uploadImmagineCopertina sopra). (cfr. RF2.7, UC_17, SDD 3.2)

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

**Nome metodo reopenRejectedArticle(articleId: Long, callerId: Long)**

**Descrizione** Riporta in stato BOZZA un articolo RIFIUTATO, permettendo all'autore di correggerlo
prima di rinviarlo in approvazione con publishArticle. Colma una lacuna del ciclo di vita originale:
prima di questo metodo un articolo RIFIUTATO non aveva alcun percorso di modifica o cancellazione
(updateDraft/deleteDraft richiedono BOZZA, updatePublishedArticle/deleteArticle richiedevano
PUBBLICATO). Chi non intende correggere l'articolo puo' invece eliminarlo direttamente con
deleteArticle (cfr. sotto), la cui pre-condizione e' stata estesa a qualunque stato diverso da
BOZZA. (cfr. RF2.7, UC_18, UC_21)

**Pre-condizioni**

> *context GestioneArticoli::reopenRejectedArticle(articleId: Long, callerId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::RIFIUTATO
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::reopenRejectedArticle(articleId: Long, callerId: Long)*
>
> post: Articolo.allInstances()-\>select(a \| a.id = articleId).stato = StatoArticolo::BOZZA

**Nome metodo updatePublishedArticle(articleId: Long, callerId: Long, dto: ArticleUpdateDTO)**

**Descrizione** Corregge un articolo già pubblicato; le modifiche sono immediatamente visibili. Se immagineCopertina cambia rispetto al valore precedente, il vecchio file viene eliminato da Cloud Storage (best-effort, CloudStorageService.delete - cfr. uploadImmagineCopertina sopra). (cfr. RF2.3, UC_20, SDD 3.2)

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

**Descrizione** Elimina definitivamente un articolo in un qualunque stato diverso da BOZZA
(PUBBLICATO, IN_ATTESA_APPROVAZIONE o RIFIUTATO) - una bozza si elimina con deleteDraft. La
copertura di IN_ATTESA_APPROVAZIONE permette all'autore il ritiro di un articolo prima che un
Manager Autori lo revisioni; quella di RIFIUTATO copre il caso in cui l'autore non intenda
correggerlo (cfr. reopenRejectedArticle, sopra, per chi invece vuole correggerlo). Rimuove
esplicitamente anche gli eventuali salvataggi degli utenti in "Preferiti"/"Leggi più tardi" (RF1.7,
RF1.8) **e** il log delle letture (VisualizzazioneArticolo, RF3.1, cfr. andamentoLetture §2.4): né
`articoli_salvati.articolo_id` né `visualizzazioni_articolo.articolo_id` hanno ON DELETE CASCADE
(vincolo di integrità referenziale deliberatamente nudo), quindi senza questa doppia pulizia
esplicita la cancellazione fallirebbe con una violazione di vincolo se l'articolo risulta ancora
salvato da almeno un utente o ha almeno una lettura registrata (possibile solo per un articolo che
*era* PUBBLICATO). Stesso approccio già adottato per CategoriaEliminataEvent: esplicito e
tracciabile a livello applicativo invece che implicito nello schema - qui non serve un evento
perché ArticoloSalvato e VisualizzazioneArticolo sono già di competenza dello stesso sottosistema
(GestioneArticoli). (cfr. RF2.4, RF2.7, UC_18, UC_19, UC_21)

**Pre-condizioni**

> *context GestioneArticoli::deleteArticle(articleId: Long, callerId: Long)*
>
> pre: Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato \<\> StatoArticolo::BOZZA
> and (a.autore.id = callerId or Utente.allInstances()-\>exists(u \| u.id = callerId and u.ruolo = Ruolo::MANAGER_AUTORI)))

**Post-condizioni**

> *context GestioneArticoli::deleteArticle(articleId: Long, callerId: Long)*
>
> post: not Articolo.allInstances()-\>exists(a \| a.id = articleId)
>
> and not ArticoloSalvato.allInstances()-\>exists(s \| s.articolo.id = articleId)
>
> and not VisualizzazioneArticolo.allInstances()-\>exists(v \| v.articolo.id = articleId)

**Nome metodo saveArticleToList(userId: Long, articleId: Long, tipo: TipoLista)**

**Descrizione** Aggiunge un articolo a “Preferiti” o “Leggi più tardi”. Solo un articolo PUBBLICATO
può essere salvato: RF1.2/RF1.7 non prevedono che un Iscritto veda o navighi una bozza o un
articolo in attesa di approvazione altrui, quindi il salvataggio va rifiutato esplicitamente alla
radice invece di essere permesso e poi ripulito quando l'autore cancella l'articolo (cfr.
deleteArticle, che invece deve ripulire perché agisce a valle su un salvataggio già esistente su un
articolo che *era* pubblicato). (cfr. RF1.7, UC_6)

**Pre-condizioni**

> *context GestioneArticoli::saveArticleToList(userId: Long, articleId: Long, tipo: TipoLista)*
>
> pre: not ArticoloSalvato.allInstances()-\>exists(s \| s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo)
>
> and Articolo.allInstances()-\>exists(a \| a.id = articleId and a.stato = StatoArticolo::PUBBLICATO)

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
| getArticleById(articleId, callerRuolo) | Recupera il dettaglio di un articolo e incrementa il contatore letture solo per Guest (callerRuolo null) e Iscritto, mai per un ruolo redazionale (Autore, Manager Autori, Gestore Utenti) a prescindere che l'articolo sia proprio o altrui - altrimenti editing/revisione/moderazione gonfierebbero "Letture totali" (Dashboard Autore) e l'ordinamento "Più lette" (Esplora). Nella stessa condizione logga anche una VisualizzazioneArticolo (RF3.1, cfr. andamentoLetture §2.4) - vedi nota sotto. `ArticleDetailDTO.categoriaAntenati` porta la catena radice -\> foglia della categoria dell'articolo (delegata a `GestioneCategorie.getCategoryPath`, §2.3), per il breadcrumb del mockup 03_dettaglio_articolo.png; lista vuota se l'articolo non ha categoria. (cfr. RF1.1) |
| getArticlesByAuthor(authorId) | Recupera gli articoli (pubblicati e bozze) di un autore per "I Miei Articoli", con numeroVisualizzazioni e numeroSalvataggi per ciascuno (`AuthorArticleSummaryDTO`). (cfr. RF2.1) |
| getSavedArticles(userId)      | Recupera la sezione “I miei salvataggi”. (cfr. RF1.8, UC_7)                                 |

**Nota (searchArticles / SearchCriteriaDTO.espandiSottocategorie)** Campo `Boolean` opzionale, aggiunto a `SearchCriteriaDTO` insieme al parametro query `espandiSottocategorie` su `GET /api/v1/articoli`. `null`/`true` (default, comportamento invariato) mantiene l'espansione a tutte le sottocategorie discendenti descritta da RF1.2 (`GestioneArticoli.espandiConSottocategorie`). `false` la disattiva esplicitamente: `categoriaIds` è usato così com'è, match esatto sulla sola categoria indicata, nessun discendente incluso — in quel caso l'intero albero categorie non viene nemmeno caricato in memoria (il ramo `espandiConSottocategorie` è del tutto bypassato). Introdotto per la navigazione a drill-down di Esplora Articoli (`CategoryDrilldownNav`, un livello alla volta): mostrare un nodo puramente organizzativo (es. "Meccanica") deve riflettere solo gli articoli attaccati direttamente a quel nodo, non l'aggregato dell'intero ramo sottostante, altrimenti comparirebbero già gli articoli di "Freni" prima ancora di scendere lì. La ricerca generale/testuale e gli "articoli correlati" (`ArticleDetailContent`, stessa categoria dell'articolo corrente) non passano questo parametro e restano quindi sul default aggregato, invariati.

**Nota (getArticleById / VisualizzazioneArticolo)** Log delle letture (tabella `visualizzazioni_articolo`, V18): una riga a ogni incremento reale di `numeroVisualizzazioni`, stessa condizione Guest/Iscritto già filtrata lì - non sostituisce il contatore (che resta la fonte rapida per card/liste), è un log **aggiuntivo**, scritto nella stessa transazione. Scrittura **sincrona**, non un evento `@Async` come `GestioneNotifiche` (§2.6): `AsyncConfig` esiste perché l'invio email è una chiamata di rete esterna potenzialmente lenta/inaffidabile che non deve bloccare né condividere la transazione del chiamante - un `INSERT` locale su una tabella stretta e indicizzata non è quel tipo di operazione (stesso ordine di grandezza dell'`UPDATE` di `numeroVisualizzazioni` già eseguito nello stesso metodo, e diretto precedente in `VisitaSessioneRepository`/`registraVisita`, già sincrono a ogni richiesta idonea). Restare nella stessa transazione è anzi un vantaggio: contatore e log si allineano per costruzione (committano o rollbackano insieme), garanzia che un evento asincrono non darebbe. `andamentoLetture` (§2.4) aggrega questo log per la dashboard Manager Autori: `GET /api/v1/autori/statistiche-autori/andamento-letture?giorni=`, `@PreAuthorize("hasRole('MANAGER_AUTORI')")`, sito-wide (non filtrato per autore) - stesso clamp `[1,90]`/zero-fill/fuso Europe/Rome degli altri grafici Manager Autori.

**Nota (getArticlesByAuthor / AuthorArticleSummaryDTO)** Endpoint REST: `GET /api/v1/articoli/me`, `@PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")`; l'ambito è per costruzione, non un filtro applicato ai risultati - `authorId` è sempre `principal.getId()` passato dal controller, mai un parametro lato client, quindi non esiste un modo per un Autore di interrogare gli articoli di un collega tramite questo endpoint. Il DTO restituito, `AuthorArticleSummaryDTO(articolo: ArticleSummaryDTO, numeroSalvataggi: long)`, è deliberatamente separato da `ArticleSummaryDTO` invece di aggiungergli direttamente il campo: `ArticleSummaryDTO`/`mappaSummary()` sono condivisi anche con `searchArticles` (Esplora articoli, pubblico, nessun `@PreAuthorize`) e `getSavedArticles` - calcolare `numeroSalvataggi` per ogni riga di ogni ricerca pubblica sarebbe un costo non richiesto fuori da questa pagina. `numeroVisualizzazioni` (già presente su `ArticleSummaryDTO`) e `numeroSalvataggi` sono entrambi 0 per una bozza o un articolo rifiutato, senza alcuna gestione speciale: non sono mai stati raggiungibili pubblicamente, quindi non hanno mai potuto accumulare letture o salvataggi. `numeroSalvataggi` somma **entrambi** i tipi di lista (`TipoLista.PREFERITI` e `LEGGI_PIU_TARDI`) in un unico totale (`ArticoloSalvatoRepository.countByArticoloIdIn`, GROUP BY su `articolo_id`, senza filtro su `tipo_lista`) - un nuovo indice dedicato (`idx_articoli_salvati_articolo`, V17) supporta questa query: l'unico indice preesistente su `articoli_salvati` era su `utente_id`, e il vincolo `UNIQUE (utente_id, articolo_id, tipo_lista)` ha `utente_id` come colonna guida, quindi non utilizzabile per un filtro/GROUP BY su `articolo_id` da solo.

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
| getCategoryPath(categoryId) | Risale la gerarchia da categoryId fino alla radice seguendo categoriaPadre e restituisce la catena radice -\> foglia (categoryId incluso come ultimo elemento). Usata dal breadcrumb del Dettaglio Articolo (`ArticleDetailDTO.categoriaAntenati`, cfr. GestioneArticoli §2.2). |

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

**Nota (limitazione nota)** Non esiste un metodo di sola lettura per consultare i dettagli di un InvitoAutore (mittente, ruolo proposto) a partire dal token, prima che l'invitato agisca con acceptInvite/declineInvite. Il mockup 33_invito_accettazione.png presuppone che la pagina web mostri questo contesto all'invitato; senza un endpoint dedicato, l'unica fonte per queste informazioni resta il testo dell'email di invito stessa (inviata da onAuthorInvited, cfr. GestioneNotifiche). Non un'omissione bloccante — il flusso resta corretto — ma un gap del contratto che una futura iterazione potrebbe colmare con una query getInviteDetails(token: String).

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

|                                 |                                                                                                    |
|---------------------------------|----------------------------------------------------------------------------------------------------|
| **Metodo (query)**              | **Descrizione**                                                                                    |
| listAuthors()                   | Recupera la lista completa degli autori attuali, con percentualeApprovazione calcolata per ciascuno. (cfr. RF3.2, UC_8) |
| getPendingArticles()            | Recupera la coda degli articoli in attesa di approvazione. (cfr. RF3.1, UC_21)                    |
| getManagerDashboardStats()      | Recupera le statistiche (es. andamento visite) per la Dashboard Manageriale. (cfr. RF3.1)         |
| andamentoPubblicazioni(giorni)  | Recupera la serie giornaliera delle pubblicazioni per il grafico "Andamento pubblicazioni" della dashboard Manager Autori, finestra di `giorni` giorni terminante oggi (fuso Europe/Rome), con zero-fill sui giorni senza dati. (cfr. RF3.1) |
| andamentoCategorie(giorni)      | Recupera la serie giornaliera delle nuove categorie per il grafico "Andamento categorie" della dashboard Manager Autori, stessa finestra/zero-fill di andamentoPubblicazioni. (cfr. RF3.1) |
| andamentoApprovazioni(giorni)   | Recupera le due serie giornaliere approvati/rifiutati per il grafico "Andamento approvazioni" della dashboard Manager Autori, stessa finestra/zero-fill di andamentoPubblicazioni. (cfr. RF3.1) |
| andamentoLetture(giorni)        | Recupera la serie giornaliera delle letture (sito-wide, non filtrata per autore) per il grafico "Andamento letture" della dashboard Manager Autori, stessa finestra/zero-fill di andamentoPubblicazioni. Bucket su VisualizzazioneArticolo.dataLettura (§2.2 getArticleById). (cfr. RF3.1) |
| getStatisticheLetture()         | Recupera i conteggi aggregati delle letture (oggi/settimana/mese/anno/totale, sito-wide, da inizio periodo corrente, fuso Europe/Rome) per la dashboard Manager Autori. (cfr. RF3.1) |
| getCategoriePiuLette()          | Recupera la classifica delle 10 categorie con più visualizzazioni totali (sottocategorie incluse nel totale del padre) per la dashboard Manager Autori. (cfr. RF3.1) |

Nota di collaborazione tra sottosistemi: acceptInvite crea un nuovo record Utente, un'operazione concettualmente di competenza di GestioneUtenti. La responsabilità resta in GestioneAutori — coerentemente con il servizio elencato nell'SDD (§4.4) — poiché l'operazione è indissolubilmente legata al ciclo di vita dell'InvitoAutore; il metodo delega comunque la creazione dell'entità Utente al repository condiviso, senza duplicare logica di validazione già presente in GestioneUtenti.registerUser.

**Nota (andamentoPubblicazioni/andamentoCategorie/andamentoApprovazioni/andamentoLetture)** Stesso pattern di clamp/zero-fill/fuso orario di GestioneAmministrazioneUtenti.andamentoVisite/andamentoRegistrazioni (§2.5): il parametro `giorni` (query param HTTP, default 30) è vincolato lato service a [1, 90], ciascun metodo restituisce sempre esattamente `giorni` punti (uno per giorno di calendario, oggi incluso), e il bucket giornaliero è calcolato in fuso Europe/Rome. Endpoint REST: `GET /api/v1/autori/statistiche-autori/andamento-pubblicazioni?giorni=`, `GET /api/v1/autori/statistiche-autori/andamento-categorie?giorni=`, `GET /api/v1/autori/statistiche-autori/andamento-approvazioni?giorni=` e `GET /api/v1/autori/statistiche-autori/andamento-letture?giorni=`, tutti `@PreAuthorize("hasRole('MANAGER_AUTORI')")` come il resto di `AutoriController`. andamentoLetture è l'unico dei quattro a leggere da una tabella di competenza di un altro sottosistema (`visualizzazioni_articolo`, scritta da GestioneArticoli.getArticleById, §2.2) - `VisualizzazioneArticoloRepository` è iniettato direttamente in `GestioneAutori`, stessa convenzione cross-sottosistema già in uso per `ArticoloRepository`/`CategoriaRepository`.

**Nota (getStatisticheLetture)** Endpoint REST: `GET /api/v1/autori/statistiche-autori/letture`, `@PreAuthorize("hasRole('MANAGER_AUTORI')")`, sito-wide (non filtrato per autore, come andamentoLetture). Stesso pattern esatto di `GestioneAmministrazioneUtenti.getVisiteStatistiche` (§2.5): le 4 finestre (oggi/settimana/mese/anno) sono da inizio periodo calendario corrente in fuso Europe/Rome, non finestre mobili, calcolate da `ConfiniPeriodoCalculator.calcola` (§2.5, `com.motormindhub.Api.utility`) - la stessa pure function condivisa con `getVisiteStatistiche`, non una copia. Tutti e 5 gli aggregati sono calcolati in un'unica scansione indicizzata su `visualizzazioni_articolo.data_lettura` via aggregazione condizionale (`COUNT(*) FILTER`, `VisualizzazioneArticoloRepository.aggregaConteggi`), stesso pattern di `VisitaSessioneRepository.aggregaConteggi`.

andamentoPubblicazioni e andamentoApprovazioni fanno bucket su `Articolo.dataDecisione` (colonna `data_decisione`, aggiunta da V16 insieme a `Categoria.dataCreazione`), non su `dataCreazione` (la bozza) né su `dataUltimoAggiornamento` (che `aggiornaContenuto` sposta in avanti a ogni correzione, anche dopo la pubblicazione): è l'unica data stampata esclusivamente da `Articolo.approva()`/`Articolo.rifiuta()` (ODD 2.4), quindi la sola a rappresentare davvero "quando il Manager ha deciso". Essendo nullable e valorizzata solo da quel momento in poi, gli articoli approvati/rifiutati prima di V16 non compaiono in nessuna delle due serie (nessun timestamp storico da cui derivarli), invece di comparire con una data indovinata. `andamentoPubblicazioni` conta solo `stato = PUBBLICATO`; `andamentoApprovazioni` espone entrambe le serie (`approvati`/`rifiutati`) sullo stesso asse, perché condividono lo stesso bucket temporale. `andamentoCategorie` fa invece bucket su `Categoria.dataCreazione` (NOT NULL, valorizzata dal costruttore): le categorie preesistenti a V16 sono state retro-datate al momento della migrazione stessa (nessuna data reale disponibile), quindi un'eventuale prima esecuzione della dashboard subito dopo il deploy di questa funzionalità mostrerà un picco anomalo nel giorno della migrazione.

**Nota (getCategoriePiuLette)** Endpoint REST: `GET /api/v1/autori/statistiche-autori/categorie-piu-lette`, `@PreAuthorize("hasRole('MANAGER_AUTORI')")`. Il totale per categoria somma le visualizzazioni (`Articolo.numeroVisualizzazioni`) dei soli articoli PUBBLICATO, propri più quelli di tutte le sottocategorie discendenti (rollup bottom-up, calcolato in memoria caricando l'intero albero — stesso approccio "centinaia di categorie, non milioni" di GestioneArticoli.espandiConSottocategorie/GestioneCategorie.getCategoryTree, §2.2/§2.3 — ma con somma ricorsiva propria+figli invece dell'espansione top-down usata per i filtri di ricerca). Restituisce le prime 10 categorie per totale decrescente; una categoria senza articoli PUBBLICATO compare comunque nell'elenco completo caricato in memoria, ma con totale 0, e finisce fuori dalla top 10 se esistono almeno 10 categorie con totale maggiore di 0.

**Nota (listAuthors)** Il campo `percentualeApprovazione` di `AuthorSummaryDTO` è calcolato come `PUBBLICATO / (IN_ATTESA_APPROVAZIONE + PUBBLICATO + RIFIUTATO)` per autore, con una singola query aggregata (`ArticoloRepository.countByAutoreIdInGroupByStato`, stesso pattern anti-N+1 di `countByAutoreIdIn`), non una query per autore dentro il `.map()`. Deliberatamente esclude BOZZA dal denominatore: una bozza non è mai stata sottoposta al Manager, quindi non è né un successo né un fallimento del processo di approvazione. Quando il denominatore è 0 (l'autore non ha mai sottomesso un articolo) il valore è `null`, non `0.0` — distingue "nessun dato" da "sottomessi, tutti rifiutati o ancora in coda".

> **2.5 GestioneAmministrazioneUtenti**

**Invarianti** *not RichiestaCancellazione.allInstances()-\>exists(r1, r2 \| r1 \<\> r2 and r1.utente = r2.utente and r1.stato = StatoRichiestaCancellazione::IN_CODA and r2.stato = StatoRichiestaCancellazione::IN_CODA) — un utente non può avere più di una richiesta di cancellazione attiva contemporaneamente.*

**Nome metodo suspendAccount(userId: Long, dto: SuspensionDTO, callerId: Long)**

**Descrizione** Sospende un account specificando motivazione e durata; pubblica l'evento di notifica. (cfr. RF4.3, UC_23) callerId identifica il Gestore Utenti chiamante (RBAC via @PreAuthorize garantisce gia' che sia un GESTORE_UTENTI): non specificato esplicitamente da RAD/RF4.3, ma necessario per il controllo di ownership tra pari sotto — un Gestore compromesso o malevolo non deve poter disattivare la moderazione di un collega sospendendone l'account. L'auto-sospensione resta permessa (callerId = userId): non e' un vettore di sicurezza, solo un incidente recuperabile da un altro Gestore.

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::suspendAccount(userId: Long, dto: SuspensionDTO, callerId: Long)*
>
> pre: Utente.allInstances()-\>exists(u \| u.id = userId and u.stato = StatoUtente::ATTIVO)
>
> and dto.motivazione.size() \> 0
>
> and (Utente.allInstances()-\>select(u \| u.id = userId).ruolo \<\> Ruolo::GESTORE_UTENTI or userId = callerId)

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::suspendAccount(userId: Long, dto: SuspensionDTO, callerId: Long)*
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

**Nome metodo registraVisita(sessioneIdEsistente: String, callerRuolo: Ruolo)**

**Descrizione** Registra una visita al sito deduplicata per sessione browser (RF3.1, UC_28): sessioneIdEsistente è il valore del cookie anonimo mmh\_visit\_session in ingresso (null se assente), separato dal refresh token. Un ruolo redazionale (Autore/Manager Autori/Gestore Utenti) non genera mai una visita — stesso filtro già applicato agli incrementi di numeroVisualizzazioni in GestioneArticoli.getArticleById (§2.2). Restituisce l'id di sessione (nuovo) da impostare nel cookie di risposta quando registra una nuova visita; vuoto quando non fa nulla, sia per ruolo escluso sia perché la sessione presentata è già registrata — il chiamante (VisiteController) non deve distinguere i due casi.

**Pre-condizioni**

> *context GestioneAmministrazioneUtenti::registraVisita(sessioneIdEsistente: String, callerRuolo: Ruolo)*
>
> pre: true — invocabile da qualunque chiamante, incluso non autenticato (callerRuolo = null)

**Post-condizioni**

> *context GestioneAmministrazioneUtenti::registraVisita(sessioneIdEsistente: String, callerRuolo: Ruolo)*
>
> post: (callerRuolo \<\> null and callerRuolo \<\> Ruolo::ISCRITTO) implies result-\>isEmpty()
>
> and (sessioneIdEsistente \<\> null and VisitaSessione.allInstances()@pre-\>exists(v \| v.sessioneId = sessioneIdEsistente)) implies result-\>isEmpty()
>
> and result-\>notEmpty() implies VisitaSessione.allInstances()-\>exists(v \| v.sessioneId = result-\>any() and v.tipo = (if callerRuolo = null then TipoVisitatore::GUEST else TipoVisitatore::ISCRITTO endif))

**Metodi di sola lettura**

|                                     |                                                                                                       |
|-------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Metodo (query)**                  | **Descrizione**                                                                                       |
| getUserManagementDashboard()        | Recupera numero utenti registrati, segnalazioni aperte e richieste GDPR in coda. (cfr. RF4.1)         |
| searchUsers(criteria)               | Ricerca, filtra e restituisce la lista degli utenti registrati con stato account e ruolo. (cfr. RF4.2, UC_22) |
| getReportsQueue()                   | Recupera la coda di lavorazione delle segnalazioni ricevute dagli utenti. (cfr. RF4.5, UC_26)         |
| getDeletionRequestsQueue()          | Recupera la coda delle richieste di cancellazione account. (cfr. RF4.6, UC_25)                        |
| getAdministrativeActionLog(filters) | Recupera la cronologia consultabile delle azioni amministrative. (cfr. RF4.8)                         |
| getVisiteStatistiche()              | Recupera i conteggi aggregati delle visite (oggi/settimana/mese/anno/totale, da inizio periodo corrente, fuso Europe/Rome). (cfr. RF3.1, UC_28) |
| andamentoVisite(giorni)             | Recupera la serie giornaliera Guest/Iscritto delle visite per il grafico "Andamento visite" della dashboard Gestore Utenti, finestra di `giorni` giorni terminante oggi (fuso Europe/Rome), con zero-fill sui giorni senza dati. (cfr. RF3.1, UC_28) |
| andamentoRegistrazioni(giorni)      | Recupera la serie giornaliera delle nuove registrazioni (solo ruolo ISCRITTO) per il grafico "Nuove registrazioni" della dashboard Gestore Utenti, stessa finestra/zero-fill di andamentoVisite. (cfr. RF4.1) |

**Nota** UserSummaryDTO (il tipo restituito da searchUsers) espone anche il campo **ruolo** (Ruolo), popolato da Utente.getRuolo() — utile alla lista "Gestione Account" del mockup 39_gestore_gestione_account.png per mostrare il ruolo di ciascun utente in colonna. UserSearchCriteriaDTO (i parametri di ricerca) non include invece un filtro per ruolo: il mockup 39 mostra solo tab di filtro per stato account (Tutti/Attivi/Sospesi/In Cancellazione), nessun filtro per ruolo — RF4.2 non lo richiede esplicitamente. Un filtro `ruolo` opzionale su UtenteRepository.search resta un'estensione separata, da valutare solo se richiesta esplicitamente lato frontend.

**Nota (andamentoVisite/andamentoRegistrazioni)** Il parametro `giorni` (query param HTTP, default 30) è vincolato lato service a [1, 90]: oltre 90 la vista scalare "anno" di getVisiteStatistiche copre già l'orizzonte lungo, e un grafico giornaliero oltre i ~90 punti perde leggibilità — non un limite tecnico della query. Entrambi i metodi restituiscono sempre esattamente `giorni` punti (uno per ogni giorno di calendario della finestra, incluso oggi), anche quando la query di aggregazione non trova righe per un dato giorno: lo zero-fill è calcolato in Java confrontando i giorni attesi con quelli effettivamente restituiti da `VisitaSessioneRepository.andamentoGiornaliero`/`UtenteRepository.andamentoGiornaliero` — un grafico a linee lato frontend disegnerebbe altrimenti un salto invece di un punto a terra nei giorni senza attività. `andamentoRegistrazioni` filtra esplicitamente `ruolo = ISCRITTO` nella query: `GestioneAutori.acceptInvite` (§2.4) inserisce righe `Utente` anche per gli inviti Autore accettati, con la stessa `dataRegistrazione` valorizzata dal costruttore — senza il filtro, un'ondata di inviti accettati dal Manager Autori gonfierebbe la crescita "organica" del pubblico che questo grafico intende mostrare. Endpoint REST: `GET /api/v1/amministrazione-utenti/statistiche-visite/andamento?giorni=` e `GET /api/v1/amministrazione-utenti/statistiche-registrazioni/andamento?giorni=`, entrambi `@PreAuthorize("hasRole('GESTORE_UTENTI')")` come il resto di `AmministrazioneUtentiController`.

**Nota (getVisiteStatistiche / ConfiniPeriodoCalculator)** Il calcolo dei 4 confini di periodo (giorno/settimana/mese/anno, calendario in fuso Europe/Rome, non finestre mobili) era originariamente un metodo privato di `GestioneAmministrazioneUtenti`; da quando `GestioneAutori.getStatisticheLetture` (§2.4) ha bisogno esattamente dello stesso calcolo, è stato estratto in `ConfiniPeriodoCalculator.calcola(oggi, zona)` (pure function, `com.motormindhub.Api.utility`) - un candidato naturale per l'astrazione perché due punti fanno esattamente lo stesso calcolo di boundary temporali, a differenza delle costanti `GIORNI_ANDAMENTO_MIN`/`MAX`, deliberatamente duplicate per sottosistema (poche righe, nessun rischio di divergenza silenziosa). I casi limite (cambio ora legale/solare, rollover di capodanno, "oggi" già lunedì) sono coperti una sola volta in `ConfiniPeriodoCalculatorTest`, non duplicati per ciascun chiamante.

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

**Descrizione** Invia i dati esportati come allegato JSON diretto via email. (cfr. RF1.10, RF4.7)

> pre: evento DataExportReadyEvent pubblicato
>
> post: email con i dati esportati allegati in formato JSON inviata

**Nota (deviazione da RNF9.3)** RNF9.3 richiede un "link di download sicuro e a scadenza". L'evento, così come pubblicato da GestioneUtenti.requestAccountDataExport e GestioneAmministrazioneUtenti.exportUserDataAssisted (ODD 2.1/2.5), trasporta già il contenuto esportato come stringa JSON, non un token da risolvere in un link temporaneo — non esiste nell'Object Model (RAD 3.4.4) un'entità per un download token con scadenza. Il file viene quindi allegato direttamente all'email invece che linkato: soddisfa comunque "l'utente riceve il link di download" (UC_27) nella sostanza (i dati arrivano via email allo stesso indirizzo verificato), ma non l'aspetto "one-time/a scadenza" della RNF, che richiederebbe un'infrastruttura di storage temporaneo fuori dallo scope di questo sottosistema.

**Nome metodo onBruteForceLockout(evt: BruteForceLockoutEvent)**

**Descrizione** Invia l'email di conferma per lo sblocco dopo un blocco per tentativi falliti. (cfr. RNF2.6)

> pre: evento BruteForceLockoutEvent pubblicato
>
> post: email di conferma sblocco inviata

> **2.7 Debito tecnico noto — paginazione e query N+1**

Nota trasversale (non un contratto di un singolo metodo) emersa da un audit di sicurezza sull'intera superficie REST: a parte la ricerca pubblica degli articoli (GestioneArticoli::searchArticles, l'unica query realmente paginata dell'intero backend), ogni altro metodo di sola lettura che restituisce una lista scarica l'intero risultato senza `LIMIT`. GestioneAutori::listAuthors (N+1 esplicito: una `countByAutoreId` per autore dentro il `.map()`) è stato corretto con un'unica query aggregata (`ArticoloRepository.countByAutoreIdIn`, GROUP BY) - stesso pattern usato preventivamente per numeroSalvataggi su GestioneArticoli::getArticlesByAuthor (`ArticoloSalvatoRepository.countByArticoloIdIn`), che quindi non aggiunge N+1 al partial già esistente su quel metodo (vedi sotto). Le occorrenze seguenti restano invece debito tecnico noto, non ancora corrette:

> - GestioneAmministrazioneUtenti::getReportsQueue — nessuna paginazione; N+1 su `Segnalazione.segnalato` (relazione lazy, diversa per riga).
> - GestioneAmministrazioneUtenti::getDeletionRequestsQueue — nessuna paginazione; N+1 su `RichiestaCancellazione.utente` (idem).
> - GestioneAmministrazioneUtenti::getAdministrativeActionLog — nessuna paginazione; N+1 su `LogAzioneAmministrativa.utenteTarget`; il filtro testuale `query` è applicato in Java dopo aver caricato tutte le righe (non in SQL) — il caso peggiore dei tre, aggravato dall'assenza di `LIMIT`.
> - GestioneArticoli::getSavedArticles — nessuna paginazione; N+1 pieno su `ArticoloSalvato.articolo` (sia `categoria` sia `autore` variano per riga).
> - GestioneAutori::getPendingArticles — nessuna paginazione; stesso N+1 pieno di getSavedArticles (categoria e autore variano per riga).
> - GestioneArticoli::getArticlesByAuthor — nessuna paginazione; N+1 parziale (solo su `categoria` — `autore` è lo stesso per ogni riga, quindi in cache L1 dopo la prima).
> - GestioneCategorie::getCategoryTree — `findAll()` senza `LIMIT`, ma nessun N+1 (l'albero è costruito in memoria da un'unica query, senza query ricorsive per nodo).

Nessuna di queste è stata corretta in questa sessione: il volume di dati coinvolto oggi (segnalazioni, richieste di cancellazione, cronologia azioni, salvataggi, categorie) resta contenuto, quindi il rischio immediato è basso — ma va tenuto presente prima di un'eventuale scala d'uso più ampia.

> **2.8 Debito tecnico noto — frontend (motormindhub-web)**

Nota trasversale emersa da un audit del frontend (gestione errori nelle mutation, copertura e2e responsive), non un contratto di un singolo componente. Solo tracciamento: nessuna correzione applicata insieme a questa nota.

**Gestione errori duplicata nelle funzioni di mutation.** Due assi distinti:

> - `extractErrorMessage()` (estrae `messages[0]` da un corpo di errore JSON, con fallback) è ridefinita identica in 7 file invece di vivere in un modulo condiviso: `lib/articoli/articleEditor.ts`, `lib/autori/authorMutations.ts`, `lib/autori/inviteResponse.ts`, `lib/categorie/categoryMutations.ts`, `lib/amministrazioneUtenti/{deletionMutations,reportMutations,userMutations}.ts`.
> - 5 file non usano nemmeno quella funzione: reimplementano lo stesso try/catch inline, senza un motivo documentato che lo giustifichi (a differenza di `lib/auth/login.ts`, che estrae anche `errorCode`, e di `lib/auth/register.ts`, che mostra tutti i messaggi non solo il primo — questi due restano intenzionalmente diversi). Le 5 occorrenze non giustificate: `lib/auth/updateProfile.ts`, `lib/auth/accountDeletion.ts`, `lib/auth/dataExport.ts`, `lib/auth/passwordReset.ts` (entrambe le funzioni), `lib/report/reportUser.ts`.

**Route senza test e2e responsive.** Il progetto ha accumulato un'incoerenza già corretta una volta (GestioneCategorie) e da allora ripresentatasi altrove: pagine reali, con logica non banale, senza alcuna verifica `setViewportSize` mobile. Corretto per `/gestore/segnalazioni` e `/gestore/segnalazioni/[reportId]` in questa sessione (`e2e/gestore-segnalazioni.spec.ts`); restano scoperte:

> - `/autore/articoli/nuovo`, `/autore/articoli/[articleId]/modifica` — Editor articolo, la pagina con più form dell'intero progetto (`e2e/autore-editor.spec.ts`, nessun test mobile).
> - `/autore/bozze` — Le Mie Bozze (`e2e/autore-bozze.spec.ts`).
> - `/account`, `/account/impostazioni` — Panoramica (`e2e/account-panoramica.spec.ts`).
> - `/account/dati`, `/account/elimina` — I Miei Dati / Elimina Account (`e2e/account-data.spec.ts`).
> - Home pubblica (`e2e/home.spec.ts`).
> - Pagine legali statiche: accessibilità, chi siamo, cookie policy, termini (`e2e/legal-pages.spec.ts`).
> - `/login`, `/registrazione`, `/(auth)/conferma-email` (`e2e/login.spec.ts`, `e2e/register-confirm.spec.ts`).
> - `/recupero-password`, `/reimposta-password` (`e2e/password-reset.spec.ts`).

Rischio basso per le pagine di solo testo (legali, home), più concreto per Editor articolo e login/registrazione — sono le pagine con più campi di form e quindi più esposte a problemi di layout su viewport stretti.

**Nessun flusso di autocandidatura per diventare Autore** — il sistema supporta solo inviti Manager-iniziati (`GestioneAutori.inviteAuthor`). Il CTA "Diventa Autore" è stato rimosso dal frontend perché non aveva un endpoint corrispondente, non per una scelta di prodotto esplicita.

> **2.9 Debito tecnico noto — errorCode mancante su handleConflitto**

Nota trasversale (non un contratto di un singolo metodo), non corretta in questa sessione. `GlobalExceptionHandler::handleConflitto` raggruppa sotto lo stesso 409, con `errorCode: null`, 9 eccezioni applicative distinte (11 classi concrete, alcune omonime in package diversi): `EmailGiaRegistrataException` (GestioneUtenti e GestioneAutori), `RichiestaCancellazioneEsistenteException`, `CategoriaGiaEsistenteException`, `CategoriaConSottocategorieException`, `ArticoloGiaSalvatoException`, `StatoArticoloNonValidoException` (GestioneArticoli e GestioneAutori), `InvitoGiaEsistenteException`, `StatoAccountNonValidoException`, `ContenutiInSospesoException`.

Un client (o un test) che deve distinguere la causa specifica di un 409 può farlo solo per testo del messaggio (`messages[0]`), fragile a un cambio di copy — a differenza degli handler che già valorizzano `errorCode` per lo stesso motivo (`CREDENZIALI_NON_VALIDE`, `ACCOUNT_NON_VERIFICATO`, `ACCOUNT_BLOCCATO`, `TOKEN_VERIFICA_SCADUTO`, `FILE_TROPPO_GRANDE`/`FORMATO_NON_SUPPORTATO`/`FILE_NON_VALIDO`). In un giro dedicato: assegnare un `errorCode` esplicito a ciascuna delle 9, stesso pattern già in uso.

> **2.10 Debito tecnico noto — nessun percorso applicativo per i diritti GDPR del GESTORE_UTENTI sui propri dati**

Nota trasversale (non un contratto di un singolo metodo), non corretta in questa sessione. GestioneUtenti (§2.1) espone l'esportazione e la cancellazione self-service per l'utente stesso; GestioneAmministrazioneUtenti (§2.5, `exportUserDataAssisted`/`processAccountDeletion`) espone la via assistita con cui il Gestore Utenti esercita quegli stessi diritti *per conto di altri utenti*. Nessuno dei due copre il caso in cui sia il Gestore Utenti a voler esercitare i propri diritti GDPR sui propri dati: il self-service esisterebbe già in astratto (GestioneUtenti non esclude il ruolo GESTORE_UTENTI dai suoi metodi), ma la via assistita non ha senso applicata a se stessi — chi assisterebbe il Gestore nell'esportare o cancellare i propri stessi dati? Oggi l'unica via concreta è l'intervento diretto sul database, fuori da qualunque percorso applicativo tracciato (RF4.8, log delle azioni amministrative).

Non corretto in questa sessione: da valutare in una revisione legale/di prodotto dedicata prima di un lancio pubblico ampio. Non è chiaro se il volume di Gestori Utenti previsto (presumibilmente basso, un ruolo interno più che un utente di massa) renda questo gap accettabile con una procedura manuale documentata, o se serva comunque un percorso applicativo dedicato — ad esempio permettendo esplicitamente al Gestore di usare su se stesso i metodi self-service di GestioneUtenti già esistenti, oggi non verificato né escluso da alcun contratto o test.
