// Riproduzione isolata (fuori da Playwright) della sequenza esatta di
// createDraftArticleInternal (e2e/helpers/test-articles.ts:39-48): POST
// categoria -> GET categorie -> find by name, ripetuto N volte, con fetch()
// nativo di Node (stesso runtime, stesso motore HTTP - undici) contro il
// backend reale già in esecuzione su :8080.
import pg from "pg";

const API_BASE = "http://localhost:8080";
const N = 70;

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "motormindhub",
  user: "mmh",
  password: "mmh",
});

async function setup() {
  const email = `repro-node-${Date.now()}@provider.it`;
  const password = "PasswordValida78!";

  const res = await fetch(`${API_BASE}/api/v1/utenti/registrazione`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Repro",
      cognome: "Node",
      email,
      password,
      consensoPrivacy: true,
    }),
  });
  if (!res.ok) throw new Error(`registrazione fallita: ${res.status} ${await res.text()}`);

  await pool.query("UPDATE utenti SET stato='ATTIVO', ruolo='MANAGER_AUTORI' WHERE email=$1", [email]);

  return { email, password };
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.accessToken;
}

async function main() {
  const { email, password } = await setup();
  const token = await login(email, password);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  let fallimenti = 0;
  const dettagli = [];

  for (let i = 0; i < N; i++) {
    const categoriaNome = `Repro-Node-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;

    const postRes = await fetch(`${API_BASE}/api/v1/categorie`, {
      method: "POST",
      headers,
      body: JSON.stringify({ nome: categoriaNome }),
    });
    const postStatus = postRes.status;
    // Stesso comportamento dell'helper reale: non consumiamo/controlliamo il body qui.

    const getRes = await fetch(`${API_BASE}/api/v1/categorie`);
    const tree = await getRes.json();

    if (!Array.isArray(tree)) {
      fallimenti++;
      dettagli.push({ i, categoriaNome, postStatus, getStatus: getRes.status, body: tree });
      continue;
    }

    const categoria = tree.find((c) => c.nome === categoriaNome);
    if (!categoria) {
      fallimenti++;
      dettagli.push({ i, categoriaNome, postStatus, getStatus: getRes.status, treeLength: tree.length });
    }
  }

  console.log(`Iterazioni: ${N}, fallimenti: ${fallimenti}`);
  if (dettagli.length > 0) {
    console.log(JSON.stringify(dettagli, null, 2));
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
