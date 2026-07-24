import { RoleGuard } from "@/components/auth/RoleGuard";
import { GestoreSidebar } from "@/components/gestore/GestoreSidebar";

export default function GestoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["GESTORE_UTENTI"]}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <GestoreSidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
