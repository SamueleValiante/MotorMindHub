import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, clearRefreshTokenCookie } from "@/lib/auth/cookies";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * Proxy verso POST /api/v1/auth/logout: invalida il refresh token lato
 * backend e ripulisce comunque il cookie locale, anche se la chiamata al
 * backend fallisce (il logout lato client deve riuscire sempre).
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.json({ message: "ok" });
  clearRefreshTokenCookie(response);
  return response;
}
