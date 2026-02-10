"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { certificationSchema, type CertificationFormValues } from "@/lib/schemas/certification"
import { createCertification, updateCertification } from "./actions"
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
import type { Certification } from "@/types/database"

interface CertificationFormProps {
  data?: Certification
}

export function CertificationForm({ data }: CertificationFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!data

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: data?.name ?? "",
      issuer: data?.issuer ?? "",
      year: data?.year ?? "",
      url: data?.url ?? "",
      badge_url: data?.badge_url ?? "",
      published: data?.published ?? true,
      show_on_resume: data?.show_on_resume ?? true,
    },
  })

  function onSubmit(values: CertificationFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCertification(data.id, values)
        : await createCertification(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Certification updated" : "Certification created")
        if (!isEdit) router.push("/admin/certifications")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Certification Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input placeholder="AWS Solutions Architect" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer</FormLabel>
                  <FormControl>
                    <Input placeholder="Amazon Web Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input placeholder="2025" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential URL</FormLabel>
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
            name="badge_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge Image</FormLabel>
                <FormDescription>Upload a certification badge or logo</FormDescription>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="projects"
                    path="certifications"
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
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Certification"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/certifications")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
