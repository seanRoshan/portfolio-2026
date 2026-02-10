"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { educationSchema, type EducationFormValues } from "@/lib/schemas/education"
import { createEducation, updateEducation } from "./actions"
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
import type { Education } from "@/types/database"

interface EducationFormProps {
  data?: Education
}

export function EducationForm({ data }: EducationFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!data

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      school: data?.school ?? "",
      degree: data?.degree ?? "",
      field: data?.field ?? "",
      year: data?.year ?? "",
      details: data?.details ?? "",
      logo_url: data?.logo_url ?? "",
      published: data?.published ?? true,
      show_on_resume: data?.show_on_resume ?? true,
    },
  })

  function onSubmit(values: EducationFormValues) {
    startTransition(async () => {
      const result = isEdit ? await updateEducation(data.id, values) : await createEducation(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Education updated" : "Education created")
        if (!isEdit) router.push("/admin/education")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="School Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <FormControl>
                    <Input placeholder="Stanford University" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree</FormLabel>
                  <FormControl>
                    <Input placeholder="B.S." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field of Study</FormLabel>
                  <FormControl>
                    <Input placeholder="Computer Science" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input placeholder="2020" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Logo</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="projects"
                    path="education"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Details">
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details</FormLabel>
                <FormDescription>GPA, honors, relevant coursework, etc.</FormDescription>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ""} />
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
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Education"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/education")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
