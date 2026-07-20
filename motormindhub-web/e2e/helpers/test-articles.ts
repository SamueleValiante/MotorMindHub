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

export async function deleteArticle(
  managerEmail: string,
  managerPassword: string,
  articleId: number
): Promise<void> {
  const token = await login(managerEmail, managerPassword);
  await fetch(`${API_BASE}/api/v1/articoli/${articleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
