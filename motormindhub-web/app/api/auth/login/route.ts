import { NextRequest, NextResponse } from "next/server";
import { setRefreshTokenCookie } from "@/lib/auth/cookies";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * Proxy verso POST /api/v1/auth/login: il refresh token opaco non lascia mai
 * questo handler, resta in un cookie httpOnly. Al client torna solo
 * l'access token, da tenere in memoria (store Zustand).
 */
export async function POST(request: NextRequest) {
  const credentials = await request.json();

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json({
    accessToken: data.accessToken,
    tokenType: data.tokenType,
  });
  setRefreshTokenCookie(response, data.refreshToken);
  return response;
}
