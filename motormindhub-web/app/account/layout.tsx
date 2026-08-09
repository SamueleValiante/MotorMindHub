import { RoleGuard } from "@/components/auth/RoleGuard";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ISCRITTO"]}>
      {/*
        md:items-stretch esplicito (già il default flex, ma qui è
        l'invariante che rende corretto lo sticky della Sidebar: il div
        deve restare alto quanto <main>, così lo sticky ha un "binario"
        lungo quanto tutta la pagina). overflow-y-auto rimosso da <main>:
        era inerte, min-h-screen non pone un tetto all'altezza del div,
        quindi <main> non è mai più corto del suo contenuto e quel
        overflow non si attiva mai — a scrollare è la pagina, non <main>.
      */}
      <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
        <AccountSidebar />
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </RoleGuard>
  );
}
