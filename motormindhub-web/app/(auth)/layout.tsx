import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/**
 * Card centrata condivisa da login/registrazione/conferma-email/recupero
 * e reimposta password (mockup 05, 06, 08, 09): stesso involucro, contenuto
 * diverso per pagina - un solo layout, un solo fix per tutte e 5. Route
 * group (nessun segmento nell'URL): /login, /registrazione, ecc. restano
 * percorsi di primo livello.
 *
 * Solo il logo è cliccabile (-> "/", la home pubblica), non un header
 * pubblico intero con nav/menu profilo: stesso principio già applicato in
 * PublicHeader e in ogni Sidebar autenticata (Logo linkato da solo, contestuale
 * - qui senza un ruolo autenticato da cui derivare un altro target, "/" è
 * l'unica destinazione sensata).
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
          <Link href="/">
            <Logo className="h-16 w-16" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
