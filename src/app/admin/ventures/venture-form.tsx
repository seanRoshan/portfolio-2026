"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ventureSchema, type VentureFormValues } from "@/lib/schemas/venture"
import { createVenture, updateVenture } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { FormSection } from "@/components/admin/form-section"
import { ImageUpload } from "@/components/admin/image-upload"
import type { Venture } from "@/types/database"

interface VentureFormProps {
  data?: Venture
}

export function VentureForm({ data }: VentureFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!data

  const form = useForm<VentureFormValues>({
    resolver: zodResolver(ventureSchema),
    defaultValues: {
      name: data?.name ?? "",
      role: data?.role ?? "",
      url: data?.url ?? "",
      icon_url: data?.icon_url ?? "",
      icon_url_dark: data?.icon_url_dark ?? "",
      description: data?.description ?? "",
      founded_year: data?.founded_year ?? "",
      published: data?.published ?? true,
    },
  })

  function onSubmit(values: VentureFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateVenture(data.id, values)
        : await createVenture(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Venture updated" : "Venture created")
        if (!isEdit) router.push("/admin/ventures")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Venture Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Founder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="founded_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Founded Year</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2024"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="icon_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo (Light Mode)</FormLabel>
                  <FormDescription>Shown on light backgrounds</FormDescription>
                  <FormControl>
                    <ImageUpload
                      value={field.value || null}
                      onChange={(url) => field.onChange(url ?? "")}
                      bucket="projects"
                      path="ventures"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon_url_dark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo (Dark Mode)</FormLabel>
                  <FormDescription>Shown on dark backgrounds</FormDescription>
                  <FormControl>
                    <ImageUpload
                      value={field.value || null}
                      onChange={(url) => field.onChange(url ?? "")}
                      bucket="projects"
                      path="ventures"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Visibility">
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Published</FormLabel>
                  <FormDescription>Show on the public site</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Venture"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/ventures")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
