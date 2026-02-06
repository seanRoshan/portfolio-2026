"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { settingsSchema, type SettingsFormValues } from "@/lib/schemas/settings"
import { updateSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import type { SiteSettings } from "@/types/database"

interface SettingsFormProps {
  data: SiteSettings
}

export function SettingsForm({ data }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_title: data.site_title,
      site_description: data.site_description ?? "",
      og_image_url: data.og_image_url ?? "",
      google_analytics_id: data.google_analytics_id ?? "",
      maintenance_mode: data.maintenance_mode,
    },
  })

  function onSubmit(values: SettingsFormValues) {
    startTransition(async () => {
      const result = await updateSettings(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Settings updated")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Site Metadata">
          <FormField
            control={form.control}
            name="site_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="site_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="og_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OG Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="avatars"
                    path="og"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Analytics & Advanced">
          <FormField
            control={form.control}
            name="google_analytics_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Analytics ID</FormLabel>
                <FormControl>
                  <Input placeholder="G-XXXXXXXXXX" {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maintenance_mode"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Maintenance Mode</FormLabel>
                  <FormDescription>Temporarily disable the public site</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
