"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Trash2, GripVertical } from "lucide-react"
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
import { updateContactInfo, type ContactInfoFormValues } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormSection } from "@/components/admin/form-section"
import { socialPlatforms, getSocialPlatform } from "@/lib/social-icons"
import type { SiteSettings } from "@/types/database"

interface SocialLinkEntry {
  platform: string
  url: string
}

function SocialIcon({ platformKey, size = 16 }: { platformKey: string; size?: number }) {
  const platform = getSocialPlatform(platformKey)
  if (!platform) return null
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0"
    >
      <path d={platform.iconPath} />
    </svg>
  )
}

function SortableSocialRow({
  id,
  entry,
  usedPlatforms,
  onRemove,
  onEdit,
}: {
  id: string
  entry: SocialLinkEntry
  usedPlatforms: Set<string>
  onRemove: () => void
  onEdit: (entry: SocialLinkEntry) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button type="button" className="text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <Select value={entry.platform} onValueChange={(val) => onEdit({ ...entry, platform: val })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Select platform">
            {entry.platform && (
              <span className="flex items-center gap-2">
                <SocialIcon platformKey={entry.platform} size={14} />
                {getSocialPlatform(entry.platform)?.label ?? entry.platform}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {socialPlatforms.map((p) => (
            <SelectItem key={p.key} value={p.key} disabled={usedPlatforms.has(p.key) && p.key !== entry.platform}>
              <span className="flex items-center gap-2">
                <SocialIcon platformKey={p.key} size={14} />
                {p.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={entry.url}
        onChange={(e) => onEdit({ ...entry, url: e.target.value })}
        placeholder="https://..."
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ContactInfoFormProps {
  data: SiteSettings
}

export function ContactInfoForm({ data }: ContactInfoFormProps) {
  const [isPending, startTransition] = useTransition()

  // Social links as array for drag-and-drop UI
  const initialLinks: SocialLinkEntry[] = Object.entries(data.social_links ?? {}).map(([platform, url]) => ({
    platform,
    url,
  }))
  const [socialLinks, setSocialLinks] = useState<SocialLinkEntry[]>(
    initialLinks.length > 0 ? initialLinks : [],
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const usedPlatforms = new Set(socialLinks.map((l) => l.platform))
  const itemIds = socialLinks.map((_, i) => `social-${i}`)

  const form = useForm<ContactInfoFormValues>({
    defaultValues: {
      contact_email: data.contact_email ?? "",
      contact_form_enabled: data.contact_form_enabled,
      social_links: data.social_links ?? {},
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)
      setSocialLinks((prev) => arrayMove(prev, oldIndex, newIndex))
    }
  }

  function addLink() {
    // Find first unused platform
    const next = socialPlatforms.find((p) => !usedPlatforms.has(p.key))
    setSocialLinks((prev) => [...prev, { platform: next?.key ?? "", url: "" }])
  }

  function removeLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function editLink(index: number, entry: SocialLinkEntry) {
    setSocialLinks((prev) => {
      const updated = [...prev]
      updated[index] = entry
      return updated
    })
  }

  function onSubmit(values: ContactInfoFormValues) {
    // Convert social links array back to record
    const record: Record<string, string> = {}
    socialLinks.forEach(({ platform, url }) => {
      const key = platform.trim().toLowerCase()
      if (key && url.trim()) record[key] = url.trim()
    })
    values.social_links = record

    startTransition(async () => {
      const result = await updateContactInfo(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Contact info updated")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection id="contact-details" title="Contact Details">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_form_enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Contact Form</FormLabel>
                  <FormDescription>
                    Allow visitors to send messages via the contact form
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection id="social-links" title="Social Links" description="Select platform and enter URL">
          <div className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {socialLinks.map((entry, i) => (
                  <SortableSocialRow
                    key={itemIds[i]}
                    id={itemIds[i]}
                    entry={entry}
                    usedPlatforms={usedPlatforms}
                    onRemove={() => removeLink(i)}
                    onEdit={(v) => editLink(i, v)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLink}>
            <Plus className="mr-1 h-4 w-4" />
            Add Social Link
          </Button>
        </FormSection>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
