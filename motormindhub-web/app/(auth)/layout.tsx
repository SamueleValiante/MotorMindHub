import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/**
 * Card centrata condivisa da login/registrazione/conferma-email/recupero
 * e reimposta password (mockup 05, 06, 08, 09): stesso involucro, contenuto
 * diverso per pagina - un solo layout, un solo fix per tutte e 5. Route
 * group (nessun segmento nell'URL): /login, /registrazione, ecc. restano
 * percorsi di primo livello.
 *
 * Il logo è cliccabile (-> "/", la home pubblica), non un header pubblico
 * intero con nav/menu profilo: stesso principio già applicato in
 * PublicHeader e in ogni Sidebar autenticata (Logo linkato da solo,
 * contestuale - qui senza un ruolo autenticato da cui derivare un altro
 * target, "/" è l'unica destinazione sensata).
 *
 * A differenza delle sidebar interne (dove la sola icona basta: un utente
 * già autenticato ha familiarità con la convenzione "il logo riporta alla
 * home"), qui il visitatore è anonimo e magari alla prima visita - un link
 * testuale esplicito accanto al logo non è ridondante, è l'unica delle due
 * uscite verso la home che comunica chiaramente il proprio scopo a chi non
 * conosce già quella convenzione. Stile/testo identici al link "← Torna
 * alla home" già usato in PublicProfileContent.tsx (stesso pattern
 * discreto, non un CTA: è un'uscita secondaria, non l'azione della pagina).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="mb-4 flex flex-col items-center gap-3">
          <Link href="/">
            <Logo className="h-16 w-16" />
          </Link>
          <Link href="/" className="font-heading text-xs uppercase tracking-wide text-fog">
            ← Torna alla home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
