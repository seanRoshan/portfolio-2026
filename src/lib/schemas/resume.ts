import { z } from "zod"

export const educationItemSchema = z.object({
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().nullable().default(null),
  year: z.string().nullable().default(null),
  details: z.string().nullable().default(null),
})

export const certificationItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  year: z.string().nullable().default(null),
  url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
})

export const additionalSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  items: z.array(z.string().min(1)).default([]),
})

export const resumeSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  title: z.string().min(1, "Title is required"),
  email: z
    .string()
    .email("Must be a valid email")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  location: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  website: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  linkedin: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  github: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  summary: z
    .string()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  education: z.array(educationItemSchema).default([]),
  certifications: z.array(certificationItemSchema).default([]),
  additional_sections: z.array(additionalSectionSchema).default([]),
})

export type ResumeFormValues = z.input<typeof resumeSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type CertificationItem = z.infer<typeof certificationItemSchema>
export type AdditionalSection = z.infer<typeof additionalSectionSchema>
