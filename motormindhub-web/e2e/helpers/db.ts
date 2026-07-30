import { Pool, type QueryResultRow } from "pg";

/**
 * Stessa porta/credenziali di docker-compose.yml e dei default in application.properties
 * (DB_URL/DB_USERNAME/DB_PASSWORD): sia in locale (Postgres in docker-compose) sia in CI
 * (service container GitHub Actions/act) la 5432 è mappata sull'host, quindi una connessione TCP
 * diretta funziona in entrambi gli ambienti — a differenza del precedente "docker exec
 * motormindhub-api-db-1", che assumeva un container Docker con quel nome esatto e falliva in CI,
 * dove Postgres gira come service container con un nome/ID diverso.
 */
const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "motormindhub",
  user: process.env.DB_USERNAME ?? "mmh",
  password: process.env.DB_PASSWORD ?? "mmh",
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
