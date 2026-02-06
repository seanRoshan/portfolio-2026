"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface YouTubeEmbedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string) => void
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function YouTubeEmbedDialog({ open, onOpenChange, onInsert }: YouTubeEmbedDialogProps) {
  const [url, setUrl] = useState("")

  const videoId = url ? extractVideoId(url) : null

  function handleClose(value: boolean) {
    if (!value) setUrl("")
    onOpenChange(value)
  }

  function handleInsert() {
    if (!videoId) return
    onInsert(`https://www.youtube.com/watch?v=${videoId}`)
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="yt-url">YouTube URL</Label>
            <Input
              id="yt-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          {videoId && (
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
              <Image
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video preview"
                width={480}
                height={360}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          )}
          {url && !videoId && (
            <p className="text-sm text-destructive">Could not extract video ID from URL</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!videoId}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
