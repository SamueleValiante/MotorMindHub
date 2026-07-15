# MotorMindHub — contesto front-end

Client Next.js per l'API già completa in motormindhub-api (6 sottosistemi,
197 test, refresh token + RBAC verificati).

## Documenti di riferimento
1. docs/PS_MotorMindHub.md, docs/RAD_MotorMindHub.md — dominio, ruoli, RF/UC
2. docs/SDD_MotorMindHub.md, docs/ODD_MotorMindHub.md — architettura, per capire
   il modello dati, NON per gli endpoint (usa Swagger per quelli, vedi sotto)
3. docs/MOCKUPS.md — mappa mockup↔sottosistema, 51 schermate in docs/mockups/
4. docs/DESIGN_SYSTEM.md — palette, font, componenti condivisi

## Fonte di verità per le API
Il backend gira su http://localhost:8080, Swagger UI su /swagger-ui.html.
PRIMA di scrivere una chiamata API, controlla lo schema reale lì — non
dedurre i campi dai contratti OCL dell'ODD, quelli descrivono la logica
di dominio, non il contratto JSON esatto (nomi campi, formati data, ecc.).

## Stack
Next.js, TypeScript, Tailwind CSS. Auth: access token JWT (30 min) +
refresh token opaco (14 giorni, rotation con reuse detection — se una
richiesta di refresh fallisce con "famiglia revocata", forza logout
completo e richiedi nuovo login, non ritentare).

## Come lavorare
Un sottosistema/area alla volta, stesso ordine di dipendenza del backend:
GestioneUtenti (auth, account) → GestioneArticoli (pubblico + autore) →
GestioneCategorie → GestioneAutori → GestioneAmministrazioneUtenti.
Per ogni pagina: apri il mockup indicato in MOCKUPS.md PRIMA di scrivere
il componente, verifica lo schema reale in Swagger PRIMA di scrivere la
chiamata API. Responsive obbligatorio (mobile-first, Tailwind).
