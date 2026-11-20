/**
 * Wrapper delle template.tsx: a ogni navigazione Next rimonta la template,
 * quindi la pagina entra con la dissolvenza definita in globals.css
 * (.mmh-page). display: contents: nessun impatto sul layout.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="mmh-page">{children}</div>;
}
