import { Logo } from "@/components/brand/Logo";

/**
 * Card centrata condivisa da login/registrazione/recupero password
 * (mockup 05, 06, 08, 09): stesso involucro, contenuto diverso per pagina.
 * Route group (nessun segmento nell'URL): /login, /registrazione, ecc.
 * restano percorsi di primo livello.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
