/**
 * Placeholder minimo: roleRedirect.ts manda già MANAGER_AUTORI qui dopo il
 * login, ma la Dashboard Manageriale vera (mockup 29, RF3.1) è un
 * sottosistema futuro (GestioneAutori) — questa pagina esiste solo perché
 * il redirect post-login non trovi un 404.
 */
export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
      <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
        Dashboard Manageriale
      </h1>
      <p className="mt-2 max-w-md text-sm text-fog">
        In arrivo. Nel frattempo puoi gestire le categorie da &quot;Gestione Categorie&quot;
        nel menu qui accanto.
      </p>
    </div>
  );
}
