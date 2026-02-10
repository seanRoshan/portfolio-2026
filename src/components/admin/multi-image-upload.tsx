"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface MultiImageUploadProps {
  images: string[]
  captions: Record<string, string>
  onChange: (images: string[], captions: Record<string, string>) => void
  bucket: "avatars" | "projects" | "blog" | "resume"
  path?: string
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function SortableImage({
  url,
  caption,
  onRemove,
  onCaptionChange,
}: {
  url: string
  caption: string
  onRemove: () => void
  onCaptionChange: (caption: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-lg border p-3">
      <button
        type="button"
        className="text-muted-foreground mt-2 cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Image
        src={url}
        alt={caption || "Gallery image"}
        width={80}
        height={60}
        className="shrink-0 rounded object-cover"
        unoptimized
      />
      <Input
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Caption (optional)"
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function MultiImageUpload({
  images,
  captions,
  onChange,
  bucket,
  path = "",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const filename = `${path ? path + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true })
      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filename)

      onChange([...images, publicUrl], captions)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleRemove(url: string) {
    const newCaptions = { ...captions }
    delete newCaptions[url]
    onChange(
      images.filter((img) => img !== url),
      newCaptions,
    )
  }

  function handleCaptionChange(url: string, caption: string) {
    onChange(images, { ...captions, [url]: caption })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string)
      const newIndex = images.indexOf(over.id as string)
      onChange(arrayMove(images, oldIndex, newIndex), captions)
    }
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {images.map((url) => (
                <SortableImage
                  key={url}
                  url={url}
                  caption={captions[url] || ""}
                  onRemove={() => handleRemove(url)}
                  onCaptionChange={(cap) => handleCaptionChange(url, cap)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="border-muted-foreground/25 hover:border-muted-foreground/50 flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed transition-colors"
      >
        {uploading ? (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-1">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Add image</span>
          </div>
        )}
      </button>
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
