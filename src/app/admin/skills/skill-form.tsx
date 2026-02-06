"use client"

import { useState, useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { skillSchema, type SkillFormValues } from "@/lib/schemas/skill"
import { createSkill, updateSkill } from "./actions"
import { techIcons, availableIconNames, getTechIcon } from "@/lib/tech-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/database"

const CATEGORIES = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "devops", label: "DevOps" },
  { key: "database", label: "Database" },
  { key: "tools", label: "Tools" },
]

interface SkillFormDialogProps {
  data?: Skill
  onDone: () => void
}

function IconPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return availableIconNames.slice(0, 40)
    const q = search.toLowerCase()
    return availableIconNames.filter((name) => name.includes(q))
  }, [search])

  const selected = getTechIcon(value)

  return (
    <div className="space-y-2">
      {/* Selected preview */}
      {selected && value && (
        <div className="flex items-center gap-2 rounded-lg border p-2">
          <selected.icon className="h-5 w-5" style={{ color: selected.color }} />
          <span className="text-sm font-medium">{value}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Grid */}
      <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
        <div className="grid grid-cols-6 gap-1">
          {filtered.map((name) => {
            const tech = techIcons[name]
            if (!tech) return null
            const Icon = tech.icon
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name)
                  setSearch("")
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md p-2 transition-colors",
                  "hover:bg-accent",
                  value === name && "bg-accent ring-primary ring-1",
                )}
              >
                <Icon className="h-5 w-5" style={{ color: tech.color }} />
                <span className="max-w-full truncate text-[10px]">{name}</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-muted-foreground col-span-6 py-4 text-center text-sm">
              No icons found
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function SkillFormDialog({ data, onDone }: SkillFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!data?.id

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: data?.name ?? "",
      category: data?.category ?? "frontend",
      icon_name: data?.icon_name ?? "",
      icon_url: data?.icon_url ?? "",
      published: data?.published ?? true,
      show_on_resume: data?.show_on_resume ?? true,
    },
  })

  function onSubmit(values: SkillFormValues) {
    startTransition(async () => {
      const result = isEdit ? await updateSkill(data!.id, values) : await createSkill(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Skill updated" : "Skill created")
        onDone()
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <IconPicker value={field.value || null} onChange={(v) => field.onChange(v ?? "")} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Published</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="show_on_resume"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Show on Resume</FormLabel>
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
