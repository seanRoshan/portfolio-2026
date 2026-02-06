"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import {
  LayoutDashboard,
  Sparkles,
  User,
  FolderKanban,
  Wrench,
  Briefcase,
  FileText,
  FileDown,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logout } from "./actions"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hero", label: "Hero", icon: Sparkles },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/skills", label: "Skills", icon: Wrench },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/resume", label: "Resume", icon: FileDown },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

interface AdminSidebarProps {
  unreadCount?: number
}

export function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Portfolio</span>
          <Badge variant="secondary" className="text-xs">Admin</Badge>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === "Messages" && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Site
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground"
          onClick={() => startTransition(() => logout())}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
}
