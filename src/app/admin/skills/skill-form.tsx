"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { skillSchema, type SkillFormValues } from "@/lib/schemas/skill"
import { createSkill, updateSkill } from "./actions"
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
import type { Skill } from "@/types/database"

const CATEGORIES = ["Frontend", "Backend", "DevOps", "Database", "Tools"]

interface SkillFormDialogProps {
  data?: Skill
  onDone: () => void
}

export function SkillFormDialog({ data, onDone }: SkillFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!data

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: data?.name ?? "",
      category: data?.category ?? "Frontend",
      icon_name: data?.icon_name ?? "",
      icon_url: data?.icon_url ?? "",
      published: data?.published ?? true,
      show_on_resume: data?.show_on_resume ?? true,
    },
  })

  function onSubmit(values: SkillFormValues) {
    startTransition(async () => {
      const result = isEdit ? await updateSkill(data.id, values) : await createSkill(values)

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
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
              <FormLabel>Icon Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. SiReact" {...field} value={field.value ?? ""} />
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
