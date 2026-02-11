"use client"

import { useState, useEffect, useCallback } from "react"
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
  Rocket,
  GraduationCap,
  Award,
  FileText,
  FileDown,
  Mail,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logout } from "./actions"
import type { LucideIcon } from "lucide-react"

interface SubItem {
  hash: string
  label: string
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  children?: SubItem[]
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/admin/hero",
    label: "Hero",
    icon: Sparkles,
    children: [
      { hash: "identity", label: "Identity" },
      { hash: "cta-buttons", label: "CTA Buttons" },
      { hash: "media", label: "Media" },
    ],
  },
  {
    href: "/admin/about",
    label: "About",
    icon: User,
    children: [
      { hash: "content", label: "Content" },
      { hash: "portrait", label: "Portrait" },
      { hash: "stats", label: "Stats" },
      { hash: "tech-stack", label: "Tech Stack" },
    ],
  },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/skills", label: "Skills", icon: Wrench },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/ventures", label: "Ventures", icon: Rocket },
  { href: "/admin/education", label: "Education", icon: GraduationCap },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  {
    href: "/admin/resume",
    label: "Resume",
    icon: FileDown,
    children: [
      { hash: "personal-info", label: "Personal Info" },
      { hash: "summary", label: "Summary" },
      { hash: "skills", label: "Skills" },
      { hash: "experience", label: "Experience" },
      { hash: "education", label: "Education" },
      { hash: "certifications", label: "Certifications" },
      { hash: "additional", label: "Additional" },
    ],
  },
  {
    href: "/admin/contact",
    label: "Contact",
    icon: Mail,
    children: [
      { hash: "contact-details", label: "Contact Details" },
      { hash: "social-links", label: "Social Links" },
    ],
  },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    children: [
      { hash: "site-metadata", label: "Site Metadata" },
      { hash: "analytics", label: "Analytics" },
      { hash: "link-animations", label: "Link Animations" },
    ],
  },
]

interface AdminSidebarProps {
  unreadCount?: number
}

export function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeHash, setActiveHash] = useState("")

  // Track the current hash for sub-item highlighting
  useEffect(() => {
    function onHashChange() {
      setActiveHash(window.location.hash.replace("#", ""))
    }
    onHashChange()
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // Auto-expand the active page's section on navigation
  useEffect(() => {
    for (const item of navItems) {
      if (item.children && pathname.startsWith(item.href) && item.href !== "/admin") {
        setExpandedItems((prev) => new Set(prev).add(item.href))
        break
      }
    }
  }, [pathname])

  const isPageActive = useCallback(
    (href: string) => {
      if (href === "/admin") return pathname === "/admin"
      return pathname.startsWith(href)
    },
    [pathname],
  )

  function toggleExpand(href: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  function scrollToHash(hash: string) {
    setActiveHash(hash)
    // Small delay to allow navigation to complete before scrolling
    requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Portfolio</span>
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isPageActive(item.href)
            const hasChildren = !!item.children?.length
            const isExpanded = expandedItems.has(item.href)

            return (
              <div key={item.href}>
                {/* Parent item */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active && !hasChildren
                        ? "bg-primary text-primary-foreground"
                        : active && hasChildren
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => {
                      if (hasChildren && active) {
                        toggleExpand(item.href)
                      } else if (hasChildren) {
                        setExpandedItems((prev) => new Set(prev).add(item.href))
                      }
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.label === "Messages" && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.href)}
                      className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors"
                    >
                      <ChevronRight
                        className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-90")}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items */}
                {hasChildren && isExpanded && (
                  <div className="border-border/50 ml-5 mt-0.5 mb-1 flex flex-col gap-0.5 border-l pl-3">
                    {item.children!.map((child) => {
                      const isSubActive = active && activeHash === child.hash
                      return (
                        <Link
                          key={child.hash}
                          href={`${item.href}#${child.hash}`}
                          onClick={() => scrollToHash(child.hash)}
                          className={cn(
                            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isSubActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="space-y-1 border-t p-3">
        <Link
          href="/"
          target="_blank"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Site
        </Link>
        <Button
          variant="ghost"
          className="text-muted-foreground w-full justify-start gap-3 px-3"
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
