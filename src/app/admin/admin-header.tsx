"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { AdminSidebar } from "./admin-sidebar"

interface AdminHeaderProps {
  title: string
  unreadCount?: number
}

export function AdminHeader({ title, unreadCount }: AdminHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-background sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div onClick={() => setOpen(false)}>
            <AdminSidebar unreadCount={unreadCount} />
          </div>
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
