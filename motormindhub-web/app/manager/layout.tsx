import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["MANAGER_AUTORI"]}>
      {/* md:items-stretch + niente overflow-y-auto su main: cfr. app/account/layout.tsx per il motivo (sticky della Sidebar). */}
      <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
        <ManagerSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
