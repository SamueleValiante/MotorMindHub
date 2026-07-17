import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AutoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["AUTORE", "MANAGER_AUTORI"]}>
      {children}
    </RoleGuard>
  );
}
