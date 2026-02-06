"use client"

import { useState, useRef } from "react"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

// Lazy-import tabs component — check if exists, otherwise use simple tabs
interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string, alt: string) => void
  postId?: string
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

async function resizeAndConvertToWebP(file: File, maxWidth = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas context failed"))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("WebP conversion failed"))
        },
        "image/webp",
        0.85
      )
    }
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = URL.createObjectURL(file)
  })
}

export function ImageUploadDialog({ open, onOpenChange, onInsert, postId }: ImageUploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setUrl("")
    setAlt("")
    setUploading(false)
  }

  function handleClose(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF are allowed")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 5MB")
      return
    }

    setUploading(true)
    try {
      const blob = await resizeAndConvertToWebP(file)
      const supabase = createClient()
      const path = postId ? `${postId}` : "drafts"
      const filename = `${path}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

      const { error } = await supabase.storage
        .from("blog")
        .upload(filename, blob, { contentType: "image/webp", upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("blog")
        .getPublicUrl(filename)

      setUrl(publicUrl)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function handleInsert() {
    if (!url) return
    onInsert(url, alt || "Blog image")
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
            <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-3 pt-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Click to upload (max 5MB)</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleFileUpload} className="hidden" />
            {url && <p className="text-xs text-muted-foreground truncate">Uploaded: {url}</p>}
          </TabsContent>
          <TabsContent value="url" className="space-y-3 pt-3">
            <div>
              <Label htmlFor="img-url">Image URL</Label>
              <Input id="img-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <Label htmlFor="img-alt">Alt text</Label>
          <Input id="img-alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image..." />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!url}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
