import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Chrome pubblica condivisa (mockup 01/02/03): header + footer.
 * Route group (nessun segmento nell'URL): / , /esplora, /articoli/[id]
 * restano percorsi di primo livello, stesso pattern di app/(auth)/layout.tsx.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
