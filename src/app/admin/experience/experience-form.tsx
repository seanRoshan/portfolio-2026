"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { experienceSchema, type ExperienceFormValues } from "@/lib/schemas/experience"
import { createExperience, updateExperience } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DynamicList } from "@/components/admin/dynamic-list"
import { ImageUpload } from "@/components/admin/image-upload"
import type { Experience } from "@/types/database"

interface ExperienceFormProps {
  data?: Experience
}

export function ExperienceForm({ data }: ExperienceFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!data

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: data?.company ?? "",
      role: data?.role ?? "",
      location: data?.location ?? "",
      start_date: data?.start_date ?? "",
      end_date: data?.end_date ?? "",
      description: data?.description ?? "",
      achievements: data?.achievements ?? [],
      company_logo_url: data?.company_logo_url ?? "",
      company_url: data?.company_url ?? "",
      published: data?.published ?? true,
      show_on_resume: data?.show_on_resume ?? true,
    },
  })

  const endDate = useWatch({ control: form.control, name: "end_date" })
  const isPresent = !endDate

  function onSubmit(values: ExperienceFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateExperience(data.id, values)
        : await createExperience(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Experience updated" : "Experience created")
        if (!isEdit) router.push("/admin/experience")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Company Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Remote / San Francisco, CA"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company URL</FormLabel>
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
          </div>
          <FormField
            control={form.control}
            name="company_logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Logo</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="projects"
                    path="logos"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Dates">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isPresent} {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="present"
              checked={isPresent}
              onCheckedChange={(checked) => {
                form.setValue("end_date", checked ? null : "")
              }}
            />
            <label htmlFor="present" className="text-sm">
              Currently working here
            </label>
          </div>
        </FormSection>

        <FormSection title="Details">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="achievements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Achievements</FormLabel>
                <FormControl>
                  <DynamicList
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Add achievement..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Visibility">
          <div className="flex flex-col gap-4">
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
            <FormField
              control={form.control}
              name="show_on_resume"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Show on Resume</FormLabel>
                    <FormDescription>Include in the generated resume</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Experience"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/experience")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
