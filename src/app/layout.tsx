import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { SessionProvider } from "@/src/components/auth/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

let metadataa: Metadata;

if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
  metadataa = {
    title: "Ynor",
    description: "Ynor est une application de gestion de projet",
    icons: {
      icon: "/dev/favicon.ico",
    },
  };
} else if (process.env.NEXT_PUBLIC_ENVIRONMENT === "preproduction") {
  metadataa = {
    title: "Ynor",
    description: "Ynor est une application de gestion de projet",
    icons: {
      icon: "/preprod/favicon.ico",
    },
  };
} else if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
  metadataa = {
    title: "Ynor",
    description: "Ynor est une application de gestion de projet",
    icons: {
      icon: "/prod/favicon.ico",
    },
  };
} else {
  metadataa = {
    title: "Ynor",
    description: "Ynor est une application de gestion de projet",
    icons: {
      icon: "/default/favicon.ico",
    },
  };
}

export const metadata: Metadata = metadataa;

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
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
