import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={["ISCRITTO", "AUTORE", "MANAGER_AUTORI", "GESTORE_UTENTI"]}
    >
      {children}
    </RoleGuard>
  );
}
