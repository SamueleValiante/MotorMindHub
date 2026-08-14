import { query } from "./db";

const API_BASE = "http://localhost:8080";

/**
 * Nessuna UI ancora per creare/approvare articoli (area Autore e coda
 * approvazione Manager Autori non costruite): questo helper esercita la
 * catena reale di endpoint via fetch diretto (crea categoria -> crea bozza
 * -> pubblica -> approva), non un insert SQL che aggirerebbe la logica
 * applicativa. Un solo utente MANAGER_AUTORI basta: quel ruolo e' ammesso
 * sia per createCategory/createDraft/publishArticle (hasAnyRole('AUTORE',
 * 'MANAGER_AUTORI')) sia per approveArticle (hasRole('MANAGER_AUTORI')).
 */

/**
 * Ogni fetch di questo file passa da qui prima di processarne il body: un
 * fallimento upstream ignorato (401 di un token scaduto, 429 del rate
 * limiter, 500...) altrimenti si manifesta molto piu' tardi come "X non
 * trovato dopo la creazione" - un messaggio che nasconde la causa reale
 * invece di riportarla (visto succedere davvero con la 429 del rate
 * limiter, cfr. RateLimitFilter). L'errore include sempre status e corpo
 * reale della risposta del backend.
 */
async function assertOk(response: Response, context: string): Promise<Response> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${context} fallita con status ${response.status}: ${body}`);
  }
  return response;
}

/**
 * Messaggio esatto di CategoriaGiaEsistenteException (GestioneCategorie.java,
 * createCategory) - copiato dal sorgente, non riformulato: handleConflitto in
 * GlobalExceptionHandler raggruppa questa e altre 8 eccezioni di dominio
 * scorrelate (email gia' registrata, invito gia' esistente, articolo gia'
 * salvato...) tutte sotto lo stesso 409 con errorCode sempre null
 * (ErrorResponseDTO.of a 3 argomenti) - lo status da solo non basta a
 * distinguere "la categoria esiste gia'" da un'altra causa di dominio, va
 * confrontato il testo del messaggio.
 */
const CATEGORIA_GIA_ESISTENTE_MESSAGE =
  "Esiste gia' una categoria con questo nome nello stesso ramo dell'albero.";

/**
 * Come assertOk, ma per la sola POST /categorie dentro createDraftArticleInternal:
 * un 409 con esattamente questo messaggio significa che la categoria esiste
 * gia' nello stesso ramo - esito accettabile qui, perche' lo scopo di questa
 * chiamata e' "assicurati che la categoria esista", non "creala per forza da
 * zero" (piu' test la riusano deliberatamente per piu' articoli, cfr.
 * esplora.spec.ts). Qualunque altro status, o un 409 con un messaggio
 * diverso, resta fatale come prima.
 */
async function assertOkOCategoriaEsistente(response: Response, context: string): Promise<void> {
  if (response.ok) return;

  if (response.status === 409) {
    const body: { messages?: string[] } = await response.clone().json().catch(() => ({}));
    if (body.messages?.[0] === CATEGORIA_GIA_ESISTENTE_MESSAGE) {
      return;
    }
  }

  const body = await response.text();
  throw new Error(`${context} fallita con status ${response.status}: ${body}`);
}

/** Esportata per i chiamanti che riusano lo stesso utente in un loop stretto (es. autore-dashboard.spec.ts): un login per iterazione esaurisce LoginRateLimiter (10/min per account) senza alcun bisogno reale di una sessione nuova ogni volta. */
export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  await assertOk(response, `login di ${email}`);
  const data: { accessToken: string } = await response.json();
  return data.accessToken;
}

interface CreateArticleOptions {
  titolo: string;
  categoriaNome: string;
  /** Default: un'unica frase semplice, coerente col vecchio comportamento plain-text. */
  testo?: string;
}

/**
 * createCategory/createDraft rispondono solo con un MessageResponseDTO
 * (nessun id): l'id va recuperato rileggendo le liste subito dopo.
 * Condiviso da tutti gli stati (BOZZA/IN_ATTESA/PUBBLICATO).
 *
 * `token`: se il chiamante lo passa esplicitamente (già ottenuto con
 * `login`), viene riusato invece di autenticarsi di nuovo - la sessione è
 * comunque valida, un login ripetuto ad ogni chiamata è solo spreco
 * (e in un loop stretto sullo stesso account esaurisce LoginRateLimiter,
 * cfr. autore-dashboard.spec.ts).
 */
async function createDraftArticleInternal(
  authorEmail: string,
  authorPassword: string,
  { titolo, categoriaNome, testo }: CreateArticleOptions,
  token?: string
): Promise<{ id: number; headers: Record<string, string> }> {
  const accessToken = token ?? (await login(authorEmail, authorPassword));
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

  await assertOkOCategoriaEsistente(
    await fetch(`${API_BASE}/api/v1/categorie`, {
      method: "POST",
      headers,
      body: JSON.stringify({ nome: categoriaNome }),
    }),
    `creazione categoria "${categoriaNome}"`
  );
  const treeResponse = await fetch(`${API_BASE}/api/v1/categorie`);
  await assertOk(treeResponse, "lettura albero categorie");
  const tree: Array<{ id: number; nome: string }> = await treeResponse.json();
  const categoria = tree.find((c) => c.nome === categoriaNome);
  if (!categoria) {
    throw new Error(
      `Categoria "${categoriaNome}" creata (200) ma assente dall'albero riletto subito dopo - inconsistenza di lettura, non un errore HTTP.`
    );
  }

  await assertOk(
    await fetch(`${API_BASE}/api/v1/articoli/bozze`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        titolo,
        testo: testo ?? "Testo di prova generato per la verifica e2e.",
        categoriaId: categoria.id,
        tag: [],
      }),
    }),
    `creazione bozza "${titolo}"`
  );
  const mieiArticoliResponse = await fetch(`${API_BASE}/api/v1/articoli/me`, { headers });
  await assertOk(mieiArticoliResponse, "lettura /articoli/me");
  // Risposta nidificata (AuthorArticleSummaryDTO, confermato su Swagger dopo il backend commit
  // 658be92 "Aggiunge numeroSalvataggi a I Miei Articoli"): {articolo: {id, titolo, ...},
  // numeroSalvataggi}, non un ArticleSummaryDTO piatto - stesso schema di lib/articoli/types.ts
  // (MyArticle) lato app.
  const mieiArticoli: Array<{ articolo: { id: number; titolo: string } }> = await mieiArticoliResponse.json();
  const bozza = mieiArticoli.find((a) => a.articolo.titolo === titolo);
  if (!bozza) {
    throw new Error(
      `Bozza "${titolo}" creata (200) ma assente da /articoli/me riletto subito dopo - inconsistenza di lettura, non un errore HTTP.`
    );
  }

  return { id: bozza.articolo.id, headers };
}

/** Restituisce l'id dell'articolo, resta in stato BOZZA. `token`: cfr. createDraftArticleInternal. */
export async function createDraftArticle(
  authorEmail: string,
  authorPassword: string,
  options: CreateArticleOptions,
  token?: string
): Promise<number> {
  const { id } = await createDraftArticleInternal(authorEmail, authorPassword, options, token);
  return id;
}

/** Restituisce l'id dell'articolo, in stato IN_ATTESA_APPROVAZIONE (pubblicato ma non ancora approvato). `token`: cfr. createDraftArticleInternal. */
export async function createPendingArticle(
  authorEmail: string,
  authorPassword: string,
  options: CreateArticleOptions,
  token?: string
): Promise<number> {
  const { id, headers } = await createDraftArticleInternal(authorEmail, authorPassword, options, token);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/articoli/bozze/${id}/pubblicazione`, { method: "POST", headers }),
    `pubblicazione bozza ${id}`
  );
  return id;
}

/** Restituisce l'id dell'articolo, ora in stato PUBBLICATO. `token`: cfr. createDraftArticleInternal. */
export async function createPublishedArticle(
  managerEmail: string,
  managerPassword: string,
  options: CreateArticleOptions,
  token?: string
): Promise<number> {
  const { id, headers } = await createDraftArticleInternal(managerEmail, managerPassword, options, token);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/articoli/bozze/${id}/pubblicazione`, { method: "POST", headers }),
    `pubblicazione bozza ${id}`
  );
  await assertOk(
    await fetch(`${API_BASE}/api/v1/autori/articoli/${id}/approvazione`, { method: "POST", headers }),
    `approvazione articolo ${id}`
  );
  return id;
}

/** approveArticle (POST /autori/articoli/{id}/approvazione): solo MANAGER_AUTORI, indipendente da chi ha scritto l'articolo — usato quando serve un autore diverso dal manager (es. verificare la dashboard di un Autore semplice, non anche Manager). `token`: cfr. createDraftArticleInternal. */
export async function approveArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number,
  token?: string
): Promise<void> {
  const accessToken = token ?? (await login(managerEmail, managerPassword));
  await assertOk(
    await fetch(`${API_BASE}/api/v1/autori/articoli/${articleId}/approvazione`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    `approvazione articolo ${articleId}`
  );
}

/** rejectArticle (POST /autori/articoli/{id}/rifiuto): porta l'articolo a RIFIUTATO, stato per cui non esiste alcun endpoint di modifica/cancellazione (verificato: updateDraft/deleteDraft richiedono BOZZA, updatePublishedArticle/deleteArticle richiedono PUBBLICATO). */
export async function rejectArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number,
  motivazione = "Motivazione di test e2e."
): Promise<void> {
  const token = await login(managerEmail, managerPassword);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/autori/articoli/${articleId}/rifiuto`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ motivazione }),
    }),
    `rifiuto articolo ${articleId}`
  );
}

/**
 * deleteDraft (DELETE /articoli/bozze/{id}): solo per una BOZZA, deleteArticle
 * rifiuterebbe (precondizione ODD: stato PUBBLICATO). Sempre chiamata in un
 * blocco finally di cleanup (7 casi su 7 nella suite, nessuno dipende dal
 * risultato): alcuni test eliminano gia' la bozza via UI come parte
 * dell'asserzione, rendendo questa chiamata un tentativo ridondante
 * best-effort - un 404 qui e' l'esito atteso ("gia' sparita"), non un
 * fallimento. Stesso pattern di deleteArticle: warning, non blocco.
 */
export async function deleteDraftArticle(
  authorEmail: string,
  authorPassword: string,
  draftId: number
): Promise<void> {
  const token = await login(authorEmail, authorPassword);
  const response = await fetch(`${API_BASE}/api/v1/articoli/bozze/${draftId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    console.warn(`deleteDraftArticle(${draftId}) fallita con status ${response.status}`);
  }
}

/**
 * deleteArticle accetta ormai anche IN_ATTESA_APPROVAZIONE direttamente
 * (precondizione estesa a qualunque stato diverso da BOZZA, cfr. Editor
 * punto 8): questo helper approva prima solo perché alcuni test lo usano
 * per verificare lo storico di un articolo passato per la revisione, non
 * perché sia più l'unica via di cancellazione.
 */
export async function deletePendingArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number
): Promise<void> {
  const token = await login(managerEmail, managerPassword);
  const headers = { Authorization: `Bearer ${token}` };
  await assertOk(
    await fetch(`${API_BASE}/api/v1/autori/articoli/${articleId}/approvazione`, {
      method: "POST",
      headers,
    }),
    `approvazione articolo ${articleId}`
  );
  await deleteArticle(managerEmail, managerPassword, articleId);
}

/** Legge davvero da GET /articoli/salvataggi (getSavedArticles), non dallo stato della UI: per verificare che i due TipoLista siano toggle indipendenti (un articolo può stare in entrambe le liste contemporaneamente). */
export async function getSavedListTypes(
  email: string,
  password: string,
  articleId: number
): Promise<string[]> {
  const token = await login(email, password);
  const response = await fetch(`${API_BASE}/api/v1/articoli/salvataggi`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await assertOk(response, "lettura /articoli/salvataggi");
  const list: Array<{ articolo: { id: number }; tipoLista: string }> = await response.json();
  return list.filter((s) => s.articolo.id === articleId).map((s) => s.tipoLista);
}

/** saveArticleToList (POST /articoli/{id}/salvataggi): semina salvataggi reali via API, non finti, per i test di I Miei Salvataggi. */
export async function saveArticleForUser(
  email: string,
  password: string,
  articleId: number,
  tipoLista: "PREFERITI" | "LEGGI_PIU_TARDI"
): Promise<void> {
  const token = await login(email, password);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/articoli/${articleId}/salvataggi`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipoLista }),
    }),
    `salvataggio articolo ${articleId} (${tipoLista})`
  );
}

/**
 * removeArticleFromList (DELETE /articoli/{id}/salvataggi/{tipoLista}):
 * usato dai test per ripulire i salvataggi PRIMA di deleteArticle — con
 * un salvataggio ancora presente, deleteArticle va in 500 (bug reale del
 * backend, articoli_salvati_articolo_id_fkey senza ON DELETE CASCADE,
 * segnalato separatamente). Chiamarlo qui evita di sporcare il DB di
 * sviluppo con articoli orfani ad ogni run, senza mascherare il bug.
 */
export async function removeSavedArticle(
  email: string,
  password: string,
  articleId: number,
  tipoLista: "PREFERITI" | "LEGGI_PIU_TARDI"
): Promise<void> {
  const token = await login(email, password);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/articoli/${articleId}/salvataggi/${tipoLista}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
    `rimozione salvataggio articolo ${articleId} (${tipoLista})`
  );
}

/**
 * createCategory (POST /categorie): a differenza di createDraftArticleInternal
 * (che crea una categoria solo come passo intermedio per una bozza), qui
 * serve una categoria reale da selezionare nel <select> dell'Editor (punto
 * 8) prima ancora di creare un articolo via UI.
 */
export async function createCategory(email: string, password: string, nome: string): Promise<number> {
  const token = await login(email, password);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/categorie`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome }),
    }),
    `creazione categoria "${nome}"`
  );
  return getCategoryId(nome);
}

/**
 * Come createCategory, ma con un padre esplicito — serve ai test che
 * verificano che deleteCategory rifiuti (409) una categoria che ha
 * sottocategorie (GestioneCategorie.deleteCategory).
 */
export async function createSubcategory(
  email: string,
  password: string,
  nome: string,
  categoriaPadreId: number
): Promise<number> {
  const token = await login(email, password);
  await assertOk(
    await fetch(`${API_BASE}/api/v1/categorie`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome, categoriaPadreId }),
    }),
    `creazione sottocategoria "${nome}"`
  );
  return getCategoryId(nome);
}

interface CategoryTreeNode {
  id: number;
  nome: string;
  figlie: CategoryTreeNode[];
}

function findCategoryByName(nodes: CategoryTreeNode[], nome: string): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.nome === nome) return node;
    const found = findCategoryByName(node.figlie, nome);
    if (found) return found;
  }
  return undefined;
}

/**
 * getCategoryTree restituisce un albero vero (figlie annidate, cfr.
 * CategoryTreeNodeDTO): una sottocategoria non è mai un elemento di primo
 * livello, va cercata ricorsivamente — altrimenti createSubcategory non
 * troverebbe mai l'id appena creato.
 */
export async function getCategoryId(nome: string): Promise<number> {
  const response = await fetch(`${API_BASE}/api/v1/categorie`);
  await assertOk(response, "lettura albero categorie");
  const tree: CategoryTreeNode[] = await response.json();
  const categoria = findCategoryByName(tree, nome);
  if (!categoria) {
    throw new Error(`Categoria "${nome}" assente dall'albero (letto con successo, HTTP 200)`);
  }
  return categoria.id;
}

/** getArticleById incrementa numeroVisualizzazioni ad ogni chiamata (endpoint pubblico): usato per dare a un articolo piu' letture di un altro nei test di ordinamento "Piu' lette". */
export async function viewArticle(articleId: number, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await assertOk(
      await fetch(`${API_BASE}/api/v1/articoli/${articleId}`),
      `lettura articolo ${articleId} (visita #${i + 1})`
    );
  }
}

/**
 * Letto direttamente dal DB (non da GET /articoli/{id}, che a sua volta
 * incrementerebbe il contatore): serve a verificare che una visita alla
 * pagina di dettaglio lo incrementi di esattamente 1, non 2 (regressione
 * dello strict-mode di React già vista sul consumo del token email).
 */
export async function getViewCount(articleId: number): Promise<number> {
  const result = await query<{ numero_visualizzazioni: number }>(
    "SELECT numero_visualizzazioni FROM articoli WHERE id=$1",
    [articleId]
  );
  return Number(result.rows[0]?.numero_visualizzazioni);
}

/**
 * SQL diretto (non un endpoint applicativo, nessuno ne espone la scrittura
 * arbitraria): simula un URL esterno storico pre-migrazione, mai passato
 * da Cloudinary, per verificare che ImageUploadField lo mostri comunque in
 * preview senza alcuna logica speciale (e2e/image-upload.spec.ts).
 */
export async function setArticleCoverImage(articleId: number, url: string): Promise<void> {
  await query("UPDATE articoli SET immagine_copertina=$1 WHERE id=$2", [url, articleId]);
}

/** `token`: cfr. createDraftArticleInternal — utile soprattutto nel cleanup di un loop (es. autore-dashboard.spec.ts), dove altrimenti un login per articolo da eliminare esaurirebbe LoginRateLimiter sullo stesso account. */
export async function deleteArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number,
  token?: string
): Promise<void> {
  const accessToken = token ?? (await login(managerEmail, managerPassword));
  const response = await fetch(`${API_BASE}/api/v1/articoli/${articleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    // Non bloccante di per se' (il cleanup di questo articolo non e' il
    // punto del test), ma un fallimento silenzioso qui e' esattamente il
    // motivo per cui una FK violation spunta piu' tardi, e senza contesto,
    // nel cleanup dell'utente in fixtures.ts: meglio un warning ora.
    console.warn(`deleteArticle(${articleId}) fallita con status ${response.status}`);
  }
}
