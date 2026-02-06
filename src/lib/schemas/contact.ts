import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().nullable().default(null),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export type ContactFormValues = z.input<typeof contactSchema>
