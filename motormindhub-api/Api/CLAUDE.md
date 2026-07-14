# MotorMindHub — contesto di progetto

Piattaforma editoriale per la divulgazione di conoscenza tecnica nell'ambito automobilistico. Cinque ruoli: Guest, Iscritto, Autore, Manager Autori, Gestore Utenti.

## Documenti di riferimento (leggere in questo ordine)

1. `docs/PS_MotorMindHub.md` — Problem Statement: dominio, scenari, requisiti ad alto livello.
2. `docs/RAD_MotorMindHub.md` — Requirement Analysis Document: requisiti funzionali (RF1-RF4) e non funzionali (RNF), use case (UC_1-UC_27), object model.
3. `docs/SDD_MotorMindHub.md` — System Design Document: architettura a tre livelli (Next.js SSR / Spring Boot REST / PostgreSQL), decomposizione in 6 sottosistemi, access control, global software control.
4. `docs/ODD_MotorMindHub.md` — Object Design Document: struttura dei pacchetti, invarianti e contratti OCL (pre/post-condizioni) per ogni metodo.

Prima di implementare un sottosistema, leggi la sezione corrispondente in tutti e 4 i documenti (usa Ctrl/Cmd+F sul nome, es. "GestioneUtenti").

## Stack

- Back-end: Java 21, Spring Boot, Spring Security (JWT stateless, RBAC via @PreAuthorize), Spring Data JPA/Hibernate, PostgreSQL, Flyway, Springdoc OpenAPI.
- Front-end (repo separato): Next.js, TypeScript, Tailwind CSS.
- Comunicazione: REST/JSON su HTTPS. Nessun template engine lato server (niente Thymeleaf).

## Architettura del back-end

Livelli: Controller (REST, `/web`) → Service (Facade per sottosistema, `/service/gestioneXxx`) → Repository (Spring Data JPA, `/model/repository`) → Entity (`/model/entity`).

Sottosistemi (ognuno un pacchetto `/service/gestioneXxx`): GestioneUtenti, GestioneArticoli, GestioneCategorie, GestioneAutori, GestioneAmministrazioneUtenti, GestioneNotifiche (listener asincroni su eventi di dominio, mai chiamate dirette sincrone per l'invio email).

Decisione di design importante: **un'unica entità `Utente`** con campo `ruolo` (enum), non una gerarchia di eredità JPA — vedi SDD §3.3 per il ragionamento completo prima di modellare le classi.

## Convenzioni di naming

- Pacchetti: lower-case. Classi: PascalCase. Metodi/variabili: camelCase.
- DTO: suffisso `DTO`. Enum: valori in UPPER_SNAKE_CASE.
- Classi di servizio: prefisso `Gestione` + nome sottosistema (es. `GestioneUtenti`), Facade su repository.
- Endpoint REST: kebab-case, versionati (`/api/v1/...`). Payload JSON: camelCase.

## Come lavorare

- Un sottosistema alla volta, nell'ordine di dipendenza (GestioneUtenti per primo — tutto dipende da lui per l'identità).
- Ogni metodo che modifica lo stato ha un contratto OCL nell'ODD (§2.x): usalo come specifica per il test unitario, non solo come commento.
- Le operazioni di sola lettura (query) non hanno contratto OCL formale nell'ODD — la descrizione testuale basta.
- Dopo ogni sottosistema: far girare i test, poi commit.
