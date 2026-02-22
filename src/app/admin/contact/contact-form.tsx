"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  GripVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
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

/* ── helper components ─────────────────────────── */

function GroupCard({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 select-none">
          {label}
        </p>
      </div>
      {children}
    </div>
  )
}

function IconInput({
  icon: Icon,
  id,
  className = "",
  ...rest
}: {
  icon: React.ComponentType<{ className?: string }>
  id: string
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Icon className="text-muted-foreground/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
      <Input id={id} className={`h-9 pl-9 text-sm ${className}`} {...rest} />
    </div>
  )
}

/* ── main component ────────────────────────────── */

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
      full_name: data.full_name ?? "",
      contact_email: data.contact_email ?? "",
      phone: data.phone ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      country: data.country ?? "",
      contact_form_enabled: data.contact_form_enabled,
      social_links: data.social_links ?? {},
      landing_show_email: data.landing_show_email ?? true,
      landing_show_phone: data.landing_show_phone ?? false,
      landing_show_location: data.landing_show_location ?? true,
      landing_show_linkedin: data.landing_show_linkedin ?? true,
      landing_show_github: data.landing_show_github ?? true,
      landing_show_portfolio: data.landing_show_portfolio ?? true,
      availability_text: data.availability_text ?? "Open to opportunities",
      landing_show_availability: data.landing_show_availability ?? false,
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
        {/* ── Section 1: Contact Details ──────────── */}
        <FormSection id="contact-details" title="Contact Details">
          <GroupCard label="Identity" icon={User}>
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="full_name"
                {...form.register("full_name")}
                placeholder="Jane Doe"
                className="h-10 font-medium"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email" className="text-xs font-medium">
                  Email
                </Label>
                <IconInput
                  icon={Mail}
                  id="contact_email"
                  {...form.register("contact_email")}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Phone
                </Label>
                <IconInput
                  icon={Phone}
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </GroupCard>

          <GroupCard label="Location" icon={MapPin}>
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="San Francisco"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-medium">
                  State
                </Label>
                <Input
                  id="state"
                  {...form.register("state")}
                  placeholder="CA"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-medium">
                  Country
                </Label>
                <Input
                  id="country"
                  {...form.register("country")}
                  placeholder="USA"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </GroupCard>

        </FormSection>

        {/* ── Section 2: Social Links ────────────── */}
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

        {/* ── Section 3: Landing Page Visibility ─── */}
        <FormSection
          id="landing-visibility"
          title="Landing Page Visibility"
          description="Control which contact details appear on your public landing page"
        >
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="landing_show_email"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">Email Address</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_phone"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">Phone Number</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_location"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">Location</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_linkedin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">LinkedIn</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_github"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">GitHub</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_portfolio"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">Portfolio</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landing_show_availability"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal">Availability Status</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {form.watch("landing_show_availability") && (
            <div className="space-y-1.5">
              <Label htmlFor="availability_text" className="text-xs font-medium">
                Status Text
              </Label>
              <Input
                id="availability_text"
                {...form.register("availability_text")}
                placeholder="Open to opportunities"
                className="h-9 text-sm"
              />
            </div>
          )}
        </FormSection>

        {/* ── Section 4: Contact Form ────────────── */}
        <FormSection id="contact-form" title="Contact Form">
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

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  )
}
