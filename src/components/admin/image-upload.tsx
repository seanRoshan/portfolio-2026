"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket: "avatars" | "projects" | "blog" | "resume"
  path?: string
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

export function ImageUpload({ value, onChange, bucket, path = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, GIF, and SVG are allowed")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 5MB")
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const filename = `${path ? path + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filename)

      onChange(publicUrl)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleRemove() {
    onChange(null)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Upload preview"
            width={200}
            height={200}
            className="rounded-md border object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-muted-foreground/25 hover:border-muted-foreground/50 flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed transition-colors"
        >
          {uploading ? (
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-1">
              <Upload className="h-6 w-6" />
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
