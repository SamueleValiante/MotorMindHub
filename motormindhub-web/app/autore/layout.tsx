import { RoleGuard } from "@/components/auth/RoleGuard";
import { AutoreSidebar } from "@/components/autore/AutoreSidebar";

export default function AutoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["AUTORE", "MANAGER_AUTORI"]}>
      {/* md:items-stretch + niente overflow-y-auto su main: cfr. app/account/layout.tsx per il motivo (sticky della Sidebar). */}
      <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
        <AutoreSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
