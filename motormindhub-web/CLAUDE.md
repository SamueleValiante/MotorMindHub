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

Endpoint pubblici con comportamento auth-opzionale (oggi: GET
/articoli/{id}, POST /api/v1/visite) richiedono che qualunque chiamata
frontend sia gated su authStatus !== "loading" — il retry-on-401 di
apiFetch NON protegge questo caso, perché l'endpoint non risponde mai
401.

## Come lavorare
Un sottosistema/area alla volta, stesso ordine di dipendenza del backend:
GestioneUtenti (auth, account) → GestioneArticoli (pubblico + autore) →
GestioneCategorie → GestioneAutori → GestioneAmministrazioneUtenti.
Per ogni pagina: apri il mockup indicato in MOCKUPS.md PRIMA di scrivere
il componente, verifica lo schema reale in Swagger PRIMA di scrivere la
chiamata API. Responsive obbligatorio (mobile-first, Tailwind).

## Fonte di verità della documentazione
docs/ in questo repo è una COPIA. La fonte di verità è
motormindhub-api/docs/. Dopo ogni aggiornamento a PS/RAD/SDD/ODD nel
backend, ricopiare manualmente qui prima di continuare il lavoro
frontend — non fidarsi che questa copia sia già aggiornata.

## Eseguire la suite e2e (Playwright) in locale
`npm run test:e2e` avvia da solo solo il front-end (playwright.config.ts,
webServer → `npm run dev`); il backend va avviato a mano PRIMA
(`./mvnw spring-boot:run` in motormindhub-api, con Postgres/Mailpit di
docker-compose.yml già su). RateLimitFilter (motormindhub-api,
SecurityConfig) applica per default le soglie di produzione (60/min
letture pubbliche, 8/min azioni sensibili): la suite le supera facilmente
anche in esecuzione seriale, senza alcuna concorrenza — verificato con
una riproduzione minimale fuori da Playwright. Prima di avviare il
backend per una sessione e2e locale, esporta le stesse env var che il job
"e2e" di ci.yml imposta:

```bash
export RATE_LIMIT_PERMISSIVE_CAPACITY_PER_MINUTE=1000000
export RATE_LIMIT_STRICT_CAPACITY_PER_MINUTE=1000000
./mvnw spring-boot:run
```

Senza, i test che creano molte categorie/articoli o registrano molti
utenti in sequenza possono fallire con un 429 che assomiglia a un bug
applicativo (es. "categoria non trovata dopo la creazione") ma non lo è.

## Checklist di autoverifica prima di committare
Prima di ogni commit, verifica con `git status --porcelain` che non
restino file untracked referenziati da import/require nel codice appena
modificato. Non fidarti che "il build locale passa" come prova
sufficiente: la working directory locale ha sempre tutti i file anche
quando git non li traccia, quindi build/tsc/test locali passano lo
stesso — il problema emerge solo su un checkout pulito (CI, un altro
collaboratore, un deploy). Già capitato più volte, lato backend (ConteggioArticoliPerAutore.java) e
lato frontend (lib/shared/useFocusTrap.ts, importato da 5 componenti già
committati ma mai aggiunto esso stesso; poi di nuovo CategoryPickerField.tsx
e useCategoryDrilldown.ts, rimasti untracked per due commit successivi) —
main è rimasto rotto su origin finché non è stato scoperto a posteriori.

Caso particolare quando NON è Claude a fare il commit (es. "niente commit,
lo faccio io"): mostrare `git status --porcelain` a fine turno non basta,
perché non intercetta come l'utente committerà davvero — `git commit -a`
o un "commit all" da IDE stage solo i file già tracciati e modificati, MAI
i file nuovi non tracciati, quindi li esclude in silenzio. In questo
scenario segnalare esplicitamente, non solo mostrare lo status: elencare
per nome i file nuovi e ricordare che vanno aggiunti con `git add`
esplicito prima del commit, non dati per scontati dentro un `commit -a`.