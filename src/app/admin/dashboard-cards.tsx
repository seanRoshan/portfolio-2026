"use client"

import Link from "next/link"
import { FolderKanban, Wrench, Briefcase, FileText, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContactSubmission } from "@/types/database"

interface DashboardCardsProps {
  counts: {
    projects: number
    skills: number
    experience: number
    blog_posts: number
    unread_messages: number
  }
  recentMessages: ContactSubmission[]
}

const statCards = [
  { key: "projects" as const, label: "Projects", icon: FolderKanban, href: "/admin/projects" },
  { key: "skills" as const, label: "Skills", icon: Wrench, href: "/admin/skills" },
  { key: "experience" as const, label: "Experience", icon: Briefcase, href: "/admin/experience" },
  { key: "blog_posts" as const, label: "Blog Posts", icon: FileText, href: "/admin/blog" },
  { key: "unread_messages" as const, label: "Unread Messages", icon: MessageSquare, href: "/admin/messages" },
]

export function DashboardCards({ counts, recentMessages }: DashboardCardsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link key={card.key} href={card.href}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts[card.key]}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{msg.name}</span>
                      {!msg.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-muted-foreground truncate">{msg.subject || msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <Link href="/admin/messages" className="text-sm text-primary hover:underline block pt-2">
                View all messages
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
