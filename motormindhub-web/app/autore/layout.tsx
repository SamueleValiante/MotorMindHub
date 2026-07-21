import { RoleGuard } from "@/components/auth/RoleGuard";
import { AutoreSidebar } from "@/components/autore/AutoreSidebar";

export default function AutoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["AUTORE", "MANAGER_AUTORI"]}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AutoreSidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
