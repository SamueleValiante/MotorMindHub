import { RoleGuard } from "@/components/auth/RoleGuard";
import { GestoreSidebar } from "@/components/gestore/GestoreSidebar";

export default function GestoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["GESTORE_UTENTI"]}>
      {/* md:items-stretch + niente overflow-y-auto su main: cfr. app/account/layout.tsx per il motivo (sticky della Sidebar). */}
      <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
        <GestoreSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
