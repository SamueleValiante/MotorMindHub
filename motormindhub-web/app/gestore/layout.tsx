import { RoleGuard } from "@/components/auth/RoleGuard";

export default function GestoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["GESTORE_UTENTI"]}>{children}</RoleGuard>;
}
