# MotorMindHub — Design System (riferimento per l'implementazione front-end)

Questo file accompagna le immagini in `docs/mockups/`. Le screenshot mostrano il layout, questo file dà i valori esatti (colori, font) che da uno screenshot non si possono dedurre in modo affidabile — usali sempre insieme.

## Palette colori

| Nome | Hex | Uso |
|---|---|---|
| Asphalt black | `#0A0B0D` | Sfondo principale |
| Carbon surface | `#16181D` | Superfici/card |
| Ember red | `#D6401A` | Accento secondario, urgenza/calore, azioni distruttive |
| Voltage amber | `#FFB800` | Accento primario, CTA, energia |
| Chrome line | `#B8BEC7` | Bordi, icone, testo secondario chiaro |
| Fog gray | `#6B7178` | Testo muto/secondario |
| Paper | `#EDEEF0` | Testo primario su sfondo scuro |
| Success green | `#3FB27F` | Badge di stato attivo/ok, toast di successo |
| Surface raised | `#20242B` | Campi input e superfici annidate dentro le card |

Badge di stato — logica cromatica fissa: verde = attivo/ok, amber = in corso/attesa, ember = sospeso/criticità.

## Tipografia

- **Oswald** (pesi 300–700) — titoli, eyebrow, elementi UI. Font condensato, tecnico/automotive.
- **Inter** (pesi 400–700) — corpo testo.
- **JetBrains Mono** — dati, statistiche, tag, badge, metadati (stile "scheda tecnica").

In Tailwind, configura questi 3 come `font-heading`, `font-body`, `font-mono` in `tailwind.config.ts`.

## Elemento firma

Un contagiri/tachimetro SVG (zone cromo → amber → ember) usato nell'hero della Home, metafora del percorso "dal neofita al professionista". Riutilizzabile come motivo decorativo ricorrente.

## Componenti consolidati (coerenti su tutte le schermate)

- Nav pubblica: top bar + footer (pagine Guest/Iscritto).
- Dashboard autenticate (Autore, Manager Autori, Gestore Utenti): layout sidebar + topbar.
- Card, tabelle, modali, toast, empty state: stesso sistema di design in tutta l'app.

## Come usare questo file con Claude Code

Nel prompt, riferisci sempre sia l'immagine sia questo file, es.:

> "Guarda docs/mockups/01_home.png e implementa la Home page in Next.js/Tailwind. Usa i colori e i font esatti da docs/DESIGN_SYSTEM.md — non stimarli dallo screenshot."

Senza questa indicazione esplicita, Claude tende a interpretare i colori "a occhio" dallo screenshot, che è impreciso (compressione JPEG, gamma del monitor, ecc.).
