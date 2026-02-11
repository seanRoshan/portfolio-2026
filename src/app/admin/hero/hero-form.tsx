"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { heroSchema, type HeroFormValues } from "@/lib/schemas/hero"
import { updateHero } from "./actions"
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
import { ImageUpload } from "@/components/admin/image-upload"
import type { HeroSection } from "@/types/database"

interface HeroFormProps {
  data: HeroSection
}

export function HeroForm({ data }: HeroFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      greeting: data.greeting ?? "",
      name: data.name,
      rotating_titles: data.rotating_titles,
      description: data.description ?? "",
      cta_primary_text: data.cta_primary_text ?? "",
      cta_primary_link: data.cta_primary_link ?? "",
      cta_secondary_text: data.cta_secondary_text ?? "",
      cta_secondary_link: data.cta_secondary_link ?? "",
      avatar_url: data.avatar_url ?? "",
      resume_url: data.resume_url ?? "",
    },
  })

  function onSubmit(values: HeroFormValues) {
    startTransition(async () => {
      const result = await updateHero(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Hero section updated")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection id="identity" title="Identity">
          <FormField
            control={form.control}
            name="greeting"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Greeting</FormLabel>
                <FormControl>
                  <Input placeholder="Hi, I'm" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="rotating_titles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rotating Titles</FormLabel>
                <FormControl>
                  <DynamicList
                    items={field.value}
                    onChange={field.onChange}
                    placeholder="Add a title..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection id="cta-buttons" title="Call-to-Action Buttons">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cta_primary_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Button Text</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cta_primary_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Button Link</FormLabel>
                  <FormControl>
                    <Input placeholder="#projects" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cta_secondary_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Button Text</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cta_secondary_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Button Link</FormLabel>
                  <FormControl>
                    <Input placeholder="#contact" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection id="media" title="Media">
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="avatars"
                    path="hero"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resume_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resume URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} value={field.value ?? ""} />
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
