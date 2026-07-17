import { NextResponse } from "next/server";

export const REFRESH_COOKIE_NAME = "mmh_rt";

// Allineato a security.refresh-token.expiration-days (14) in application.properties.
const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  // Path "/" (non solo /api/auth): il middleware deve poter leggere la
  // presenza del cookie anche sulle richieste di navigazione verso le
  // route protette (/account, /autore, ...), non solo sulle chiamate API.
  path: "/",
};

export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string
): void {
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearRefreshTokenCookie(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}
