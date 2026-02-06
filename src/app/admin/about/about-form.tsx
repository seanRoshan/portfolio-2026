"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { aboutSchema, type AboutFormValues } from "@/lib/schemas/about"
import { updateAbout } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormSection } from "@/components/admin/form-section"
import { DynamicList } from "@/components/admin/dynamic-list"
import { DynamicKeyValueList } from "@/components/admin/dynamic-key-value-list"
import { ImageUpload } from "@/components/admin/image-upload"
import type { AboutSection } from "@/types/database"

interface AboutFormProps {
  data: AboutSection
}

export function AboutForm({ data }: AboutFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      heading: data.heading ?? "",
      subheading: data.subheading ?? "",
      bio: data.bio,
      bio_secondary: data.bio_secondary ?? "",
      portrait_url: data.portrait_url ?? "",
      stats: data.stats ?? [],
      tech_stack: data.tech_stack ?? [],
    },
  })

  function onSubmit(values: AboutFormValues) {
    startTransition(async () => {
      const result = await updateAbout(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("About section updated")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Content">
          <FormField
            control={form.control}
            name="heading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading</FormLabel>
                <FormControl><Input placeholder="About Me" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subheading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subheading</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl><Textarea rows={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio_secondary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Bio</FormLabel>
                <FormControl><Textarea rows={3} {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Portrait">
          <FormField
            control={form.control}
            name="portrait_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portrait Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="avatars"
                    path="about"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Stats" description="Key metrics displayed in the about section">
          <FormField
            control={form.control}
            name="stats"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DynamicKeyValueList
                    items={field.value ?? []}
                    onChange={field.onChange}
                    keyLabel="Label"
                    valueLabel="Value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Tech Stack">
          <FormField
            control={form.control}
            name="tech_stack"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DynamicList
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Add technology..."
                  />
                </FormControl>
                <FormMessage />
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
