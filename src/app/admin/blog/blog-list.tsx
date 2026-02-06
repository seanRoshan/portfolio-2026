"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Pencil, Trash2, Plus, Copy, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteBlogPost, duplicateBlogPost } from "./actions"
import type { BlogPost } from "@/types/database"

type Filter = "all" | "published" | "drafts"

export function BlogList({ posts: initial }: { posts: BlogPost[] }) {
  const [posts, setPosts] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = posts.filter((p) => {
    if (filter === "published" && !p.published) return false
    if (filter === "drafts" && p.published) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteBlogPost(deleteTarget.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Post deleted")
        setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      }
      setDeleteTarget(null)
    })
  }

  function handleDuplicate(post: BlogPost) {
    startTransition(async () => {
      const result = await duplicateBlogPost(post.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Post duplicated")
        // Reload to get fresh data
        window.location.reload()
      }
    })
  }

  const publishedCount = posts.filter((p) => p.published).length
  const draftCount = posts.filter((p) => !p.published).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({posts.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftCount})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="pl-8 w-[200px]"
            />
          </div>
          <Link href="/admin/blog/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((post) => (
          <div key={post.id} className="flex items-center gap-3 rounded-lg border p-3">
            {post.cover_image_url && (
              <Image
                src={post.cover_image_url}
                alt={post.title}
                width={64}
                height={42}
                className="rounded object-cover h-[42px]"
                unoptimized
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{post.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {post.published_at && (
                  <time>{new Date(post.published_at).toLocaleDateString()}</time>
                )}
                {post.read_time_minutes && <span>{post.read_time_minutes} min read</span>}
                {post.tags.length > 0 && (
                  <span className="truncate">{post.tags.join(", ")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={post.published ? "default" : "outline"}>
                {post.published ? "Published" : "Draft"}
              </Badge>
              <Link href={`/admin/blog/${post.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(post)} disabled={isPending}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(post)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {search ? "No posts match your search." : "No blog posts yet. Create your first one!"}
        </p>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</DialogTitle>
            <DialogDescription>This will permanently delete the post and its images. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
