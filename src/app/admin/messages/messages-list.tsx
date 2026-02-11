"use client"

import { useState, useTransition } from "react"
import {
  Search,
  Mail,
  MailOpen,
  Trash2,
  CheckCheck,
  Reply,
  Inbox,
  CircleCheck,
  Archive,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { markMessageRead, markAllMessagesRead, deleteMessage } from "./actions"
import type { ContactSubmission } from "@/types/database"

// ── Helpers ────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getPreview(msg: ContactSubmission): string {
  if (msg.subject) return msg.subject
  return msg.message.length > 80 ? msg.message.slice(0, 80) + "..." : msg.message
}

// ── Component ──────────────────────────────────────────────────────

type Filter = "all" | "unread" | "read"

export function MessagesList({ messages }: { messages: ContactSubmission[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmission | null>(null)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const unreadCount = messages.filter((m) => !m.read).length

  function matchesSearch(msg: ContactSubmission): boolean {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      msg.name.toLowerCase().includes(q) ||
      msg.email.toLowerCase().includes(q) ||
      (msg.subject?.toLowerCase().includes(q) ?? false) ||
      msg.message.toLowerCase().includes(q)
    )
  }

  function filterMessages(filter: Filter): ContactSubmission[] {
    return messages.filter((msg) => {
      if (filter === "unread" && msg.read) return false
      if (filter === "read" && !msg.read) return false
      return matchesSearch(msg)
    })
  }

  function handleExpand(msg: ContactSubmission) {
    setExpandedId(expandedId === msg.id ? null : msg.id)
    if (!msg.read) {
      startTransition(async () => {
        await markMessageRead(msg.id, true)
      })
    }
  }

  function handleToggleRead(msg: ContactSubmission) {
    startTransition(async () => {
      const result = await markMessageRead(msg.id, !msg.read)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllMessagesRead()
      if (result?.error) toast.error(result.error)
      else toast.success("All messages marked as read")
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteMessage(deleteTarget.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Message deleted")
      setDeleteTarget(null)
      setExpandedId(null)
    })
  }

  function renderEmptyState(filter: Filter) {
    if (search) {
      return (
        <div className="flex flex-col items-center gap-2 py-12">
          <Search className="text-muted-foreground/40 h-10 w-10" />
          <p className="text-muted-foreground text-sm">No messages match your search</p>
        </div>
      )
    }

    const states = {
      all: {
        icon: Inbox,
        title: "No messages yet",
        subtitle: "Messages from your contact form will appear here",
      },
      unread: {
        icon: CircleCheck,
        title: "All caught up!",
        subtitle: "No unread messages",
      },
      read: {
        icon: Archive,
        title: "No read messages",
        subtitle: "Messages you've read will appear here",
      },
    }

    const state = states[filter]
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <state.icon className="text-muted-foreground/40 h-10 w-10" />
        <p className="font-medium">{state.title}</p>
        <p className="text-muted-foreground text-sm">{state.subtitle}</p>
      </div>
    )
  }

  function renderMessage(msg: ContactSubmission) {
    const isExpanded = expandedId === msg.id
    const initial = msg.name.charAt(0).toUpperCase()
    const avatarColor = getAvatarColor(msg.name)

    return (
      <div
        key={msg.id}
        className={`overflow-hidden rounded-lg border transition-colors ${
          !msg.read ? "border-l-primary border-l-2" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => handleExpand(msg)}
          className="hover:bg-accent/50 flex w-full items-center gap-3 p-3 text-left transition-colors"
        >
          <div
            className={`${avatarColor} flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white`}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`truncate text-sm ${!msg.read ? "font-semibold" : "text-muted-foreground font-medium"}`}
              >
                {msg.name}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatRelativeTime(msg.created_at)}
              </span>
            </div>
            <p className="text-muted-foreground truncate text-sm">{getPreview(msg)}</p>
          </div>
        </button>

        {isExpanded && (
          <div className="bg-muted/30 space-y-4 border-t px-4 py-4">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span>From:</span>
              <a href={`mailto:${msg.email}`} className="hover:text-foreground underline">
                {msg.name} &lt;{msg.email}&gt;
              </a>
              <span className="mx-1">·</span>
              <time>{new Date(msg.created_at).toLocaleString()}</time>
            </div>
            {msg.subject && (
              <p className="text-sm font-medium">Subject: {msg.subject}</p>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject || "Your message"}`)}`}
              >
                <Button variant="outline" size="sm">
                  <Reply className="mr-2 h-3 w-3" />
                  Reply
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleRead(msg)}
                disabled={isPending}
              >
                {msg.read ? (
                  <>
                    <Mail className="mr-2 h-3 w-3" /> Mark Unread
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-3 w-3" /> Mark Read
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(msg)}
              >
                <Trash2 className="mr-2 h-3 w-3" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({messages.length})</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({messages.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-50 pl-8"
              />
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          {(["all", "unread", "read"] as Filter[]).map((filter) => {
            const filtered = filterMessages(filter)
            return (
              <TabsContent key={filter} value={filter} className="space-y-2">
                {filtered.length === 0
                  ? renderEmptyState(filter)
                  : filtered.map(renderMessage)}
              </TabsContent>
            )
          })}
        </div>
      </Tabs>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>
              From: {deleteTarget?.name}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
