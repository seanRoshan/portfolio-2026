"use client"

import { useState, useTransition } from "react"
import { Mail, MailOpen, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { markMessageRead, deleteMessage } from "./actions"
import type { ContactSubmission } from "@/types/database"

export function MessagesList({ messages }: { messages: ContactSubmission[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmission | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggleRead(msg: ContactSubmission) {
    startTransition(async () => {
      const result = await markMessageRead(msg.id, !msg.read)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteMessage(deleteTarget.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Message deleted")
      setDeleteTarget(null)
    })
  }

  function handleExpand(msg: ContactSubmission) {
    setExpandedId(expandedId === msg.id ? null : msg.id)
    // Auto-mark as read when expanding
    if (!msg.read) {
      startTransition(async () => {
        await markMessageRead(msg.id, true)
      })
    }
  }

  const unread = messages.filter((m) => !m.read)
  const read = messages.filter((m) => m.read)

  function renderMessage(msg: ContactSubmission) {
    const isExpanded = expandedId === msg.id
    return (
      <div key={msg.id} className="overflow-hidden rounded-lg border">
        <button
          type="button"
          onClick={() => handleExpand(msg)}
          className="hover:bg-accent/50 flex w-full items-center gap-3 p-3 text-left transition-colors"
        >
          {!msg.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`truncate font-medium ${!msg.read ? "text-foreground" : "text-muted-foreground"}`}
              >
                {msg.name}
              </span>
              <span className="text-muted-foreground text-xs">&lt;{msg.email}&gt;</span>
            </div>
            <p className="text-muted-foreground truncate text-sm">
              {msg.subject || "(No subject)"}
            </p>
          </div>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {new Date(msg.created_at).toLocaleDateString()}
          </span>
        </button>
        {isExpanded && (
          <div className="bg-muted/50 space-y-3 border-t p-4">
            <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
            <div className="flex items-center gap-2">
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
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({messages.length})</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unread.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 text-xs">
                {unread.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {messages.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">No messages yet</p>
          )}
          {messages.map(renderMessage)}
        </TabsContent>
        <TabsContent value="unread" className="space-y-2">
          {unread.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">All caught up!</p>
          )}
          {unread.map(renderMessage)}
        </TabsContent>
        <TabsContent value="read" className="space-y-2">
          {read.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">No read messages</p>
          )}
          {read.map(renderMessage)}
        </TabsContent>
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
