import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "@/lib/auth/cookies";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * Proxy verso POST /api/v1/auth/refresh: legge il refresh token dal cookie
 * httpOnly (mai esposto al client JS), lo scambia con uno nuovo (rotation)
 * e aggiorna il cookie. Il cookie viene ripulito e si risponde 401 SOLO
 * quando il backend rifiuta esplicitamente il token (401 ->
 * RefreshTokenNonValidoException: scaduto, revocato, o riutilizzo
 * rilevato con conseguente revoca della famiglia) — l'unico caso in cui
 * "il token non è più valido" è un fatto accertato.
 *
 * Un errore infrastrutturale (backend irraggiungibile, 5xx transitorio:
 * osservato dal vivo su produzione, cfr. indagine cookie di terze parti)
 * NON è un rifiuto del token: il cookie resta intatto e si risponde 503,
 * cosa diversa da "sessione non valida" per il chiamante (ensureFreshAccessToken
 * non deve forzare "anonymous" per questo, altrimenti un reload durante un
 * blip trasforma un utente ancora loggato in uno sloggato senza motivo).
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Nessuna sessione attiva." },
      { status: 401 }
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { message: "Backend non raggiungibile." },
      { status: 503 }
    );
  }

  if (backendResponse.status === 401) {
    const response = NextResponse.json(
      { message: "Sessione non valida." },
      { status: 401 }
    );
    clearRefreshTokenCookie(response);
    return response;
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "Servizio non disponibile." },
      { status: 503 }
    );
  }

  const data = await backendResponse.json();
  const response = NextResponse.json({
    accessToken: data.accessToken,
    tokenType: data.tokenType,
  });
  setRefreshTokenCookie(response, data.refreshToken);
  return response;
}
