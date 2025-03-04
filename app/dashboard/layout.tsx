import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!session) {
    redirect("/auth/signin");
  }

  const userId = session?.user?.id;

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} className="w-64 h-full border-r" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
