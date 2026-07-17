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
 * e aggiorna il cookie. Se il backend rifiuta la richiesta (token scaduto,
 * revocato, o riutilizzo rilevato con conseguente revoca della famiglia),
 * il cookie viene ripulito e si risponde 401 senza alcun retry: sta al
 * chiamante (store/AuthProvider) forzare lo stato "anonymous".
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Nessuna sessione attiva." },
      { status: 401 }
    );
  }

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendResponse.ok) {
    const response = NextResponse.json(
      { message: "Sessione non valida." },
      { status: 401 }
    );
    clearRefreshTokenCookie(response);
    return response;
  }

  const data = await backendResponse.json();
  const response = NextResponse.json({
    accessToken: data.accessToken,
    tokenType: data.tokenType,
  });
  setRefreshTokenCookie(response, data.refreshToken);
  return response;
}
