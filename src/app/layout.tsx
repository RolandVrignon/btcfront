import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { SessionProvider } from "@/src/components/auth/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mon Application",
  description: "Créée avec Next.js et Shadcn UI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn("bg-background font-sans antialiased", inter.variable)}
      >
        <SessionProvider>
            {children}
        </SessionProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
