"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updateContactInfo, type ContactInfoFormValues } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { FormSection } from "@/components/admin/form-section"
import { DynamicKeyValueList } from "@/components/admin/dynamic-key-value-list"
import type { SiteSettings } from "@/types/database"

interface ContactInfoFormProps {
  data: SiteSettings
}

export function ContactInfoForm({ data }: ContactInfoFormProps) {
  const [isPending, startTransition] = useTransition()

  // Convert social_links from Record<string,string> to {label,value}[] for the UI
  const socialLinksArray = Object.entries(data.social_links ?? {}).map(([label, value]) => ({
    label,
    value,
  }))

  const form = useForm<ContactInfoFormValues>({
    defaultValues: {
      contact_email: data.contact_email ?? "",
      contact_form_enabled: data.contact_form_enabled,
      social_links: data.social_links ?? {},
    },
  })

  function onSubmit(values: ContactInfoFormValues) {
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
        <FormSection title="Contact Details">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@example.com" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_form_enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Contact Form</FormLabel>
                  <FormDescription>Allow visitors to send messages via the contact form</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Social Links" description="Platform name and URL pairs">
          <DynamicKeyValueList
            items={socialLinksArray}
            onChange={(items) => {
              const record: Record<string, string> = {}
              items.forEach(({ label, value }) => { if (label) record[label] = value })
              form.setValue("social_links", record)
            }}
            keyLabel="Platform"
            valueLabel="URL"
          />
        </FormSection>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
