import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["MANAGER_AUTORI"]}>{children}</RoleGuard>;
}
