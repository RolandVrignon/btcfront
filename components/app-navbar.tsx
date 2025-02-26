"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"

export function AppNavbar() {
  return (
    <div className="p-2 bg-sidebar w-full border-b border-gray-200 flex-shrink-0 flex justify-between items-center">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => window.location.href = '/'}>+ Nouveau projet</Button>
        <Button onClick={() => window.location.href = '/'}>Partager</Button>
        <UserAvatar />
      </div>
    </div>
  )
}