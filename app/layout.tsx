import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppNavbar } from "@/components/app-navbar"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Mon Application",
  description: "Créée avec Next.js et Shadcn UI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(
        "h-screen bg-background font-sans antialiased overflow-hidden",
        inter.variable
      )}>
        <SidebarProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            <div className="flex h-screen w-screen">
              <AppSidebar />
              <main className="flex-1 flex flex-col h-full overflow-hidden">
                <AppNavbar />
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}