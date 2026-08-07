# MotorMindHub — Design System (riferimento per l'implementazione front-end)

Questo file accompagna le immagini in `docs/mockups/`. Le screenshot mostrano il layout, questo file dà i valori esatti (colori, font) che da uno screenshot non si possono dedurre in modo affidabile — usali sempre insieme.

## Palette colori

| Nome | Hex | Uso |
|---|---|---|
| Asphalt black | `#0A0B0D` | Sfondo principale |
| Carbon surface | `#16181D` | Superfici/card |
| Ember red | `#EE471D` | Accento secondario, urgenza/calore, azioni distruttive |
| Accent blue | `#3DA9FC` | Accento brand: nav, logo, CTA/bottoni primari, titoli hero, link, focus ring generico, gauge |
| Status pending amber | `#FFB800` | Badge di stato "in corso/attesa" nelle code di lavoro — vedi "Due token, due ruoli" sotto |
| Chrome line | `#B8BEC7` | Bordi, icone, testo secondario chiaro |
| Fog gray | `#888E95` | Testo muto/secondario |
| Fog gray (disabled) | `#8C8C8C` | Testo muto/secondario in stato disabled — colore dedicato, non fog con opacità ridotta |
| Paper | `#EDEEF0` | Testo primario su sfondo scuro |

Badge di stato — logica cromatica fissa: verde = attivo/ok, **status-pending** = in corso/attesa, ember = sospeso/criticità.

### Due token, due ruoli: accent e status-pending

Fino a una revisione precedente un solo token ("amber", `#FFB800`) copriva
sia il ruolo di accento brand (nav, CTA, hero, gauge) sia quello di colore
di stato "in attesa" nei badge di dominio — un'ambiguità che rendeva ogni
nuovo elemento amber un'interpretazione caso per caso. I due ruoli sono
ora due token CSS separati (`--color-accent`, `--color-status-pending`),
con un criterio esplicito per assegnare un elemento nuovo all'uno o
all'altro:

- **`accent` (`#3DA9FC`, blu)** — tutto ciò che comunica "questo è il
  brand/l'azione principale": nav, logo, bottoni primari/CTA, titoli hero,
  link, focus ring generico, il gauge/contagiri. Include anche gli esiti
  una-tantum di un flusso (es. icona di conferma "invito accettato"), i
  tag di navigazione/contenuto (es. il chip categoria di un articolo) e
  le notifiche generiche (es. il toast "info") — nessuno di questi è un
  indicatore di stato di dominio persistente, quindi restano accent anche
  se visivamente "attirano l'attenzione" in modo simile a un badge di
  stato.
- **`status-pending` (`#FFB800`, ambra — valore invariato dal vecchio
  "amber")** — riservato **esclusivamente** a indicatori di stato di
  dominio letti da un campo di stato reale, mostrati in una coda o
  dashboard di lavoro (es. `StatoBadge` articolo "In revisione", pill
  "In cancellazione"/richieste di cancellazione/segnalazioni in Gestione
  Utenti). Il blu di `accent` non comunica "attesa" con lo stesso
  significato universale di ambra/giallo: da qui la scelta di tenere i
  due ruoli su token distinti invece di riunificarli, anche se in futuro
  uno dei due valori esatti cambiasse ancora.
- **Criterio pratico per un elemento nuovo**: chiediti se il colore sta
  descrivendo *lo stato di un dato* (una riga di tabella, un record) che
  cambierebbe visivamente se quel dato passasse a un altro stato — se sì,
  `status-pending` (o il colore di stato appropriato: verde/ember). Se il
  colore sta invece marcando *un'azione, una destinazione, o un elemento
  di brand* — `accent`. Nel dubbio, preferisci `accent`: è il default più
  sicuro, dato che il set di indicatori di stato reali è piccolo e già
  interamente elencato sopra.

**Correzione fog gray (era `#6B7178`)**: il valore originale falliva la soglia
WCAG AA (4.5:1, testo normale) su tutti e tre gli sfondi scuri della
palette — verificato in audit di accessibilità (axe-core + calcolo diretto
del rapporto di contrasto): 3.99:1 su asphalt, 3.60:1 su carbon, 3.16:1 su
surface-raised (`#20242B`, il vincolo più stringente dei tre perché è il
più chiaro — un grigio che passa lì passa automaticamente anche sugli
altri due, più scuri). `#888E95` mantiene la stessa tonalità fredda
dell'originale (stessi delta relativi tra i canali R/G/B, solo più
chiaro) e passa con margine su tutti e tre: 5.95:1 (asphalt), 5.37:1
(carbon), 4.71:1 (surface-raised) — margine deliberato sopra la soglia
minima, non il valore limite esatto, per restare conforme anche a fronte
di arrotondamenti di rendering reali.

**Fog gray (disabled)**: prima era fog allo stesso 60% di opacità
applicato via classi Tailwind (`disabled:opacity-60` su testo `text-fog`)
— un meccanismo che rompe il contrasto indipendentemente dal colore base
(con il fog corretto sopra, il 60% di opacità scenderebbe comunque a
~2.85:1 su surface-raised, sotto soglia). Un colore dedicato, neutro
(nessuna tonalità fredda, per leggersi come "più spento" rispetto al fog
attivo pur restando conforme) e sempre a piena opacità, evita il
problema alla radice: 5.86:1 (asphalt), 5.28:1 (carbon), 4.63:1
(surface-raised).

**Correzione ember red (era `#D6401A`)**: usato in due ruoli opposti che
un solo valore non può soddisfare entrambi lasciandolo invariato — come
testo (bordo/testo ember, badge di stato "Rifiutato", messaggi di errore)
su sfondi scuri, dove serve **più chiaro** per passare, e come sfondo
pieno dei bottoni distruttivi con testo sopra, dove il testo chiaro serve
**più scuro** per passare. Il valore originale falliva entrambe le
direzioni: 3.90:1 come testo su carbon, 3.93:1 per `paper` come testo sopra
`bg-ember` (verificato in audit: bottoni "Candidati come Autore",
"Sospendi account", "Scala a sospensione").

Soluzione a due parti, non un solo colore diverso:
1. `#EE471D` — stessa tonalità calda dell'originale (stessi rapporti
   relativi tra i canali R/G/B), schiarito quanto basta per passare come
   testo sui due sfondi dove è realmente usato oggi: 4.70:1 su carbon,
   5.21:1 su asphalt (con margine sopra soglia, non al limite). *Non*
   verificato su surface-raised (4.12:1, sotto soglia) perché ember non è
   usato come testo lì in nessun punto del codice attuale — se un futuro
   componente lo introducesse su quello sfondo, andrebbe ricontrollato.
2. I bottoni a sfondo pieno (`bg-ember`) sono passati da testo `paper` a
   testo **`asphalt`** — stesso pattern già usato dai bottoni `bg-accent`
   (testo scuro su accento acceso, non testo chiaro). Necessario perché
   schiarire ember (punto 1) peggiora il contrasto di `paper` sopra
   `bg-ember` (scende a 3.26:1): un solo valore non poteva risolvere
   entrambe le direzioni, la combinazione stessa andava sostituita.
   `asphalt` su `bg-ember` corretto: 5.21:1.

## Tipografia

- **Oswald** (pesi 300–700) — titoli, eyebrow, elementi UI. Font condensato, tecnico/automotive.
- **Inter** (pesi 400–700) — corpo testo.
- **JetBrains Mono** — dati, statistiche, tag, badge, metadati (stile "scheda tecnica").

In Tailwind, configura questi 3 come `font-heading`, `font-body`, `font-mono` in `tailwind.config.ts`.

## Elemento firma

Un contagiri/tachimetro SVG usato nell'hero della Home, metafora del percorso "dal neofita al professionista". Riutilizzabile come motivo decorativo ricorrente. Due zone, non tre (era cromo → amber → ember): un arco `accent` (blu) solido per l'80% del percorso, poi un salto diretto — un piccolo gap angolare, non una sfumatura — alla zona "redline" in `ember` per l'ultimo ~18%. Il confine cromo/amber/ember originale a tre zone non reggeva più dopo che l'accento è diventato blu: una transizione morbida tra blu e rosso (colori agli antipodi sulla ruota cromatica) leggeva come una zona intermedia blu-violacea poco leggibile, verificato in mockup — da qui il taglio netto invece della sfumatura organica.

## Componenti consolidati (coerenti su tutte le schermate)

- Nav pubblica: top bar + footer (pagine Guest/Iscritto).
- Dashboard autenticate (Autore, Manager Autori, Gestore Utenti): layout sidebar + topbar.
- Card, tabelle, modali, toast, empty state: stesso sistema di design in tutta l'app.

## Come usare questo file con Claude Code

Nel prompt, riferisci sempre sia l'immagine sia questo file, es.:

> "Guarda docs/mockups/01_home.png e implementa la Home page in Next.js/Tailwind. Usa i colori e i font esatti da docs/DESIGN_SYSTEM.md — non stimarli dallo screenshot."

Senza questa indicazione esplicita, Claude tende a interpretare i colori "a occhio" dallo screenshot, che è impreciso (compressione JPEG, gamma del monitor, ecc.).
