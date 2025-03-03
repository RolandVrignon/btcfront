"use client"

import { UserNav } from "@/components/auth/user-nav"
import { SidebarTrigger } from "./ui/sidebar"

export function AppNavbar() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
      <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SidebarTrigger />
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  )
}