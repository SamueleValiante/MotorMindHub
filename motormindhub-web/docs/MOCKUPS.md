# MotorMindHub — Mappa Mockup ↔ Sottosistemi

Questo file collega ognuna delle 51 schermate ad alta fedeltà del RAD (§3.4.7) al sottosistema dell'SDD che la implementa, con il nome file esatto. Quando lavori su un sottosistema con Claude Code, referenzi la sezione corrispondente e ottieni l'elenco preciso dei mockup da rispettare.

**Setup**: copia tutti i 51 PNG (nomi originali, nessuna rinomina necessaria) in `docs/mockups/` — struttura piatta, non servono sottocartelle.

**Come usarlo nel prompt:**

> "Implementiamo il front-end di GestioneArticoli. Segui la sezione 'GestioneArticoli' in docs/MOCKUPS.md: per ogni schermata elencata, apri il file PNG indicato in docs/mockups/ e riproducilo fedelmente (layout, componenti, testi) rispettando docs/DESIGN_SYSTEM.md per colori e font."

Nota: `Firefox_Screenshot_2026-07-09T14-18-50.363Z.png` non fa parte delle 51 schermate numerate — è uno screenshot di riferimento a parte, non mappato qui sotto.

---

## Componenti trasversali

Non appartengono a un singolo sottosistema — riferimento per componenti condivisi e pagine statiche, usabili indipendentemente da quale sottosistema stai implementando.

| File | Schermata (RAD) | Note |
|---|---|---|
| `10_cookie_banner.png` | Cookie banner | Componente globale, primo accesso |
| `11_legal_termini.png` | Termini e Condizioni d'Uso | Pagina statica |
| `12_legal_cookie_policy.png` | Cookie Policy | Pagina statica |
| `13_legal_accessibilita.png` | Dichiarazione di Accessibilità | Pagina statica (RNF8) |
| `14_chi_siamo.png` | Chi Siamo | Pagina statica |
| `50_component_toast.png` | Notifiche Toast (successo / errore / info) | Componente condiviso da tutti i sottosistemi |
| `51_component_empty_states.png` | Empty states | Componente condiviso (liste vuote, nessun risultato, ecc.) |

---

## GestioneUtenti

Copre NP1 (Guest, parte) e NP2 (Iscritto). Autenticazione, profilo, diritti GDPR self-service, segnalazioni.

| File | Schermata (RAD) | Rif. |
|---|---|---|
| `05_login.png` | Login | RF1.4, UC_2 |
| `06_registrazione.png` | Registrazione | RF1.3, UC_1 |
| `07_conferma_email.png` | Conferma / verifica email | UC_1 |
| `08_recupero_password.png` | Recupero password — richiesta | RF1.5, UC_3 |
| `09_reimposta_password.png` | Recupero password — reimposta | RF1.5, UC_3 |
| `15_account_panoramica.png` | Area Personale — Panoramica | NP2 |
| `16_account_impostazioni.png` | Impostazioni Profilo | RF1.6, UC_4 |
| `18_form_segnalazione.png` | Form di Segnalazione profilo/contenuto | RF1.9, UC_26 |
| `19_account_elimina.png` | Elimina Account (diritto all'oblio) | RF1.10, UC_25 |
| `20_account_dati.png` | I Miei Dati ed Esportazione | RF1.10 |

---

## GestioneArticoli

Copre NP1/NP2 (lettura pubblica, liste salvate) e NP3 (Autore — creazione/gestione articoli).

| File | Schermata (RAD) | Rif. |
|---|---|---|
| `01_home.png` | Home Page | NP1 |
| `02_esplora_articoli.png` | Esplora Articoli | RF1.2 |
| `03_dettaglio_articolo.png` | Dettaglio Articolo | RF1.1 |
| `03b_menu_salvataggio.png` | Menu di salvataggio (Preferiti / Leggi più tardi) | RF1.7, UC_6 |
| `17_account_salvataggi.png` | I Miei Salvataggi | RF1.8, UC_7 — vive nell'area account ma i dati/metodi (`getSavedArticles`) sono di GestioneArticoli |
| `21_autore_dashboard.png` | Dashboard Autore | RF2.1, NP3 |
| `22_autore_articoli.png` | I Miei Articoli | RF2.1 |
| `23_autore_editor_nuovo.png` | Editor — Nuovo Articolo | RF2.2, UC_15 |
| `24_autore_editor_modifica.png` | Editor — Modifica Articolo | RF2.3, UC_20 |
| `25_autore_bozze.png` | Le Mie Bozze | RF2.7, UC_16-17 |
| `26_autore_popup_elimina.png` | Popup — Elimina Bozza/Articolo | RF2.4, UC_18-19 |

---

## GestioneCategorie

Vista lato Autore (creazione) e lato Manager Autori (moderazione/rimozione) — stesso sottosistema, due ruoli.

| File | Schermata (RAD) | Rif. |
|---|---|---|
| `27_autore_categorie.png` | Categorie (lato Autore) | RF2.5 |
| `28_autore_form_categoria.png` | Form — Crea/Modifica Categoria | RF2.5, RF2.6, UC_12, UC_14 |
| `34_manager_categorie.png` | Gestione Categorie (lato Manager) | RF3.5 |
| `35_manager_popup_riassegnazione.png` | Popup — Riassegnazione articoli orfani | RF3.5, UC_13 |

---

## GestioneAutori

Copre NP4 (Manager Autori) — inviti, rimozione, revisione editoriale.

| File | Schermata (RAD) | Rif. |
|---|---|---|
| `29_manager_dashboard.png` | Dashboard Manageriale | RF3.1, NP4 |
| `30_manager_autori.png` | Gestione Autori | RF3.2, UC_8 |
| `31_manager_form_nuovo_autore.png` | Form — Nuovo Autore (invito) | RF3.3, UC_8-9 |
| `32_manager_popup_rimuovi_autore.png` | Popup — Rimuovi Autore | RF3.4, UC_11 |
| `33_invito_accettazione.png` | Accettazione/Rifiuto Invito (lato invitato) | UC_10 |
| `36_manager_articoli_attesa.png` | Articoli in Attesa di Approvazione | UC_21 |
| `37_manager_approvazione_dettaglio.png` | Revisione Articolo — Approvazione/Rifiuto | RF3.6, UC_21 |

---

## GestioneAmministrazioneUtenti

Copre NP5 (Gestore Utenti) — moderazione community, segnalazioni, GDPR assistito.

| File | Schermata (RAD) | Rif. |
|---|---|---|
| `38_gestore_dashboard.png` | Dashboard Gestione Utenti | RF4.1, NP5 |
| `39_gestore_gestione_account.png` | Gestione Account | RF4.2, UC_22 |
| `40_gestore_scheda_utente.png` | Scheda Profilo Utente | RF4.2 |
| `41_gestore_popup_sospendi.png` | Popup — Sospendi Account | RF4.3, UC_23 |
| `42_gestore_ricorsi.png` | Ricorsi | RF4.3 (gestione ricorso a sospensione) |
| `43_gestore_popup_riattiva.png` | Popup — Riattiva Account | RF4.4, UC_24 |
| `44_gestore_coda_segnalazioni.png` | Coda Segnalazioni | RF4.5, UC_26 |
| `45_gestore_dettaglio_segnalazione.png` | Dettaglio Segnalazione | RF4.5, UC_26 |
| `46_gestore_coda_cancellazioni.png` | Coda Richieste di Cancellazione | RF4.6, UC_25 |
| `47_gestore_popup_conferma_cancellazione.png` | Popup — Conferma Elaborazione Cancellazione | RF4.6, UC_25 |
| `48_gestore_cronologia.png` | Cronologia Azioni Amministrative | RF4.8 |
| `49_gestore_conferma_esportazione.png` | Conferma Invio Esportazione Dati | RF4.7, UC_27 |

---

## Checklist d'uso

- [ ] Ho copiato tutti i 51 PNG (nomi originali) in `docs/mockups/`
- [ ] `docs/DESIGN_SYSTEM.md` è presente per i colori/font esatti
- [ ] Nel prompt per ogni sottosistema referenzio sia la sezione corrispondente di questo file sia `DESIGN_SYSTEM.md`
- [ ] I componenti trasversali (Toast, Empty state, Navbar/Footer impliciti nelle pagine statiche) li implemento una volta sola e li riuso, non li duplico per sottosistema
