export type Ruolo = "ISCRITTO" | "AUTORE" | "MANAGER_AUTORI" | "GESTORE_UTENTI";

export interface AccessTokenPayload {
  sub: string;
  uid: number;
  ruolo: Ruolo;
  iat: number;
  exp: number;
}

/**
 * Decodifica il payload di un access token JWT senza verificarne la firma:
 * la firma è già stata verificata dal backend, qui serve solo a leggere i
 * claim (uid, ruolo) per l'autorizzazione lato client. Va chiamata solo in
 * browser (usa atob).
 */
export function decodeAccessToken(token: string): AccessTokenPayload {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    throw new Error("Access token malformato");
  }

  const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );

  return JSON.parse(json) as AccessTokenPayload;
}
