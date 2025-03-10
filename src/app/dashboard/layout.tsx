import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { AceternitySidebar } from "@/src/components/ui/aceternity-sidebar";
import { redirect } from "next/navigation";
import { Toaster } from "@/src/components/ui/sonner";

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
      <AceternitySidebar userId={userId} className="h-[100dvh]" />
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster />
    </div>
  );
}
