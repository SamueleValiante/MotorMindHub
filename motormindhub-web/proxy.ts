import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/cookies";

const PROTECTED_PREFIXES = ["/account", "/autore", "/manager", "/gestore"];

/**
 * Gate leggero (file convention "proxy", ex "middleware" da Next.js 16): non
 * ha accesso all'access token (che vive solo in memoria lato client) e non
 * decodifica nulla. Controlla solo la presenza del cookie del refresh token:
 * "sessione presente sì/no", non il ruolo. L'autorizzazione per ruolo vera e
 * propria avviene lato client, dopo il bootstrap, nel layout di ciascun
 * gruppo protetto (RoleGuard).
 *
 * Un cookie presente ma scaduto/revocato supera comunque questo gate: verrà
 * corretto subito dopo dal bootstrap (ensureFreshAccessToken fallisce ->
 * RoleGuard reindirizza a /login), senza che l'utente veda contenuti
 * protetti nel frattempo.
 */
export function proxy(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !request.cookies.has(REFRESH_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/autore/:path*", "/manager/:path*", "/gestore/:path*"],
};
