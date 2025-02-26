"use client"

import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, Link2 } from "lucide-react"

export function AppNavbar() {

    return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <SidebarTrigger />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
          <Button>
            <Link2 className="h-4 w-4" />
            Partager
          </Button>
          <UserAvatar />
        </div>
      </div>
    </div>
  )
}