import { execSync } from "node:child_process";

const API_BASE = "http://localhost:8080";
const DB_CONTAINER = "motormindhub-api-db-1";

/**
 * Nessuna UI ancora per creare/approvare articoli (area Autore e coda
 * approvazione Manager Autori non costruite): questo helper esercita la
 * catena reale di endpoint via fetch diretto (crea categoria -> crea bozza
 * -> pubblica -> approva), non un insert SQL che aggirerebbe la logica
 * applicativa. Un solo utente MANAGER_AUTORI basta: quel ruolo e' ammesso
 * sia per createCategory/createDraft/publishArticle (hasAnyRole('AUTORE',
 * 'MANAGER_AUTORI')) sia per approveArticle (hasRole('MANAGER_AUTORI')).
 */

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data: { accessToken: string } = await res.json();
  return data.accessToken;
}

interface CreatePublishedArticleOptions {
  titolo: string;
  categoriaNome: string;
}

/** Restituisce l'id dell'articolo, ora in stato PUBBLICATO. */
export async function createPublishedArticle(
  managerEmail: string,
  managerPassword: string,
  { titolo, categoriaNome }: CreatePublishedArticleOptions
): Promise<number> {
  const token = await login(managerEmail, managerPassword);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // createCategory/createDraft rispondono solo con un MessageResponseDTO
  // (nessun id): l'id va recuperato rileggendo le liste subito dopo.
  await fetch(`${API_BASE}/api/v1/categorie`, {
    method: "POST",
    headers,
    body: JSON.stringify({ nome: categoriaNome }),
  });
  const tree: Array<{ id: number; nome: string }> = await fetch(`${API_BASE}/api/v1/categorie`).then(
    (r) => r.json()
  );
  const categoria = tree.find((c) => c.nome === categoriaNome);
  if (!categoria) throw new Error(`Categoria "${categoriaNome}" non trovata dopo la creazione`);

  await fetch(`${API_BASE}/api/v1/articoli/bozze`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      titolo,
      testo: "Testo di prova generato per la verifica e2e.",
      categoriaId: categoria.id,
      tag: [],
    }),
  });
  const mieiArticoli: Array<{ id: number; titolo: string }> = await fetch(
    `${API_BASE}/api/v1/articoli/me`,
    { headers }
  ).then((r) => r.json());
  const bozza = mieiArticoli.find((a) => a.titolo === titolo);
  if (!bozza) throw new Error(`Bozza "${titolo}" non trovata dopo la creazione`);

  await fetch(`${API_BASE}/api/v1/articoli/bozze/${bozza.id}/pubblicazione`, {
    method: "POST",
    headers,
  });
  await fetch(`${API_BASE}/api/v1/autori/articoli/${bozza.id}/approvazione`, {
    method: "POST",
    headers,
  });

  return bozza.id;
}

/** Legge davvero da GET /articoli/salvataggi (getSavedArticles), non dallo stato della UI: per verificare che i due TipoLista siano toggle indipendenti (un articolo può stare in entrambe le liste contemporaneamente). */
export async function getSavedListTypes(
  email: string,
  password: string,
  articleId: number
): Promise<string[]> {
  const token = await login(email, password);
  const list: Array<{ articolo: { id: number }; tipoLista: string }> = await fetch(
    `${API_BASE}/api/v1/articoli/salvataggi`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());
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
  await fetch(`${API_BASE}/api/v1/articoli/${articleId}/salvataggi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tipoLista }),
  });
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
  await fetch(`${API_BASE}/api/v1/articoli/${articleId}/salvataggi/${tipoLista}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getCategoryId(nome: string): Promise<number> {
  const tree: Array<{ id: number; nome: string }> = await fetch(`${API_BASE}/api/v1/categorie`).then(
    (r) => r.json()
  );
  const categoria = tree.find((c) => c.nome === nome);
  if (!categoria) throw new Error(`Categoria "${nome}" non trovata`);
  return categoria.id;
}

/** getArticleById incrementa numeroVisualizzazioni ad ogni chiamata (endpoint pubblico): usato per dare a un articolo piu' letture di un altro nei test di ordinamento "Piu' lette". */
export async function viewArticle(articleId: number, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await fetch(`${API_BASE}/api/v1/articoli/${articleId}`);
  }
}

/**
 * Letto direttamente dal DB (non da GET /articoli/{id}, che a sua volta
 * incrementerebbe il contatore): serve a verificare che una visita alla
 * pagina di dettaglio lo incrementi di esattamente 1, non 2 (regressione
 * dello strict-mode di React già vista sul consumo del token email).
 */
export function getViewCount(articleId: number): number {
  const output = execSync(
    `docker exec ${DB_CONTAINER} psql -U mmh -d motormindhub -t -A -c "SELECT numero_visualizzazioni FROM articoli WHERE id=${articleId};"`
  )
    .toString()
    .trim();
  return Number(output);
}

export async function deleteArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number
): Promise<void> {
  const token = await login(managerEmail, managerPassword);
  const response = await fetch(`${API_BASE}/api/v1/articoli/${articleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    // Non bloccante di per se' (il cleanup di questo articolo non e' il
    // punto del test), ma un fallimento silenzioso qui e' esattamente il
    // motivo per cui una FK violation spunta piu' tardi, e senza contesto,
    // nel cleanup dell'utente in fixtures.ts: meglio un warning ora.
    console.warn(`deleteArticle(${articleId}) fallita con status ${response.status}`);
  }
}
