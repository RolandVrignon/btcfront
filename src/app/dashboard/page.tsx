import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import { ProjectTools } from "@/src/components/project-tools";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return <ProjectTools project={null} userId={session.user.id} />;
}
