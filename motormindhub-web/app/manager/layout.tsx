import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["MANAGER_AUTORI"]}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <ManagerSidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
