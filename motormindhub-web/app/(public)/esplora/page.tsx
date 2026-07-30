import { Suspense } from "react";
import { EsploraContent } from "./EsploraContent";

// force-dynamic: EsploraContent filtra/pagina via router.push su searchParams (query, pagina,
// categoriaIds, ordinamento) senza cambiare pathname. Statica di default, questa route ha lo
// staleTime client-side dei contenuti statici (5 min, cfr. header x-nextjs-stale-time), che fa
// riusare al Router Cache la RSC payload gia' in cache invece di rifare il render quando cambia
// solo la query string - un secondo click su "pagina 2" (o un cambio filtro) non ha alcun
// effetto visibile. Mai emerso finche' Playwright girava contro "next dev" (cfr. Fase B, ci.yml),
// che disattiva il Full Route Cache; force-dynamic allinea lo staleTime lato client a 0, coerente
// col fatto che il contenuto reale dipende sempre dai searchParams correnti.
export const dynamic = "force-dynamic";

export default function EsploraPage() {
  return (
    <Suspense fallback={<p className="p-12 text-center text-sm text-fog">Caricamento…</p>}>
      <EsploraContent />
    </Suspense>
  );
}
