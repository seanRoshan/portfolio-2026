import { z } from 'zod'

// ===== Contact Info =====
export const contactInfoSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required').or(z.literal('')),
  phone: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  linkedin_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  github_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  portfolio_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  blog_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
})

export type ContactInfoFormValues = z.infer<typeof contactInfoSchema>

// ===== Summary =====
export const summarySchema = z.object({
  text: z.string().max(500, 'Summary should be 1-3 sentences (max 500 chars)'),
  is_visible: z.boolean(),
})

export type SummaryFormValues = z.infer<typeof summarySchema>

// ===== Achievement =====
export const achievementSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Achievement text is required'),
  sort_order: z.number().default(0),
})

// ===== Work Experience =====
export const workExperienceSchema = z.object({
  id: z.string().optional(),
  job_title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_promotion: z.boolean().default(false),
  achievements: z.array(achievementSchema).default([]),
  sort_order: z.number().default(0),
})

export type WorkExperienceFormValues = z.infer<typeof workExperienceSchema>

// ===== Education =====
export const educationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  field_of_study: z.string().optional(),
  graduation_date: z.string().optional(),
  gpa: z.number().min(0).max(4.0).optional().nullable(),
  relevant_coursework: z.array(z.string()).optional(),
  honors: z.string().optional(),
  sort_order: z.number().default(0),
})

export type EducationFormValues = z.infer<typeof educationSchema>

// ===== Skill Category =====
export const skillCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  sort_order: z.number().default(0),
})

export type SkillCategoryFormValues = z.infer<typeof skillCategorySchema>

// ===== Project =====
export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  project_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  source_url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  description: z.string().optional(),
  achievements: z.array(achievementSchema).default([]),
  sort_order: z.number().default(0),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

// ===== Certification =====
export const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().optional(),
  date: z.string().optional(),
  sort_order: z.number().default(0),
})

export type CertificationFormValues = z.infer<typeof certificationSchema>

// ===== Extracurricular =====
export const extracurricularSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    'patent',
    'publication',
    'talk',
    'open_source',
    'community',
    'other',
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  url: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  sort_order: z.number().default(0),
})

export type ExtracurricularFormValues = z.infer<typeof extracurricularSchema>

// ===== Resume Settings =====
export const resumeSettingsSchema = z.object({
  accent_color: z.string().default('#000000'),
  font_family: z
    .enum(['inter', 'source_sans', 'lato', 'georgia', 'garamond', 'source_code'])
    .default('inter'),
  font_size_preset: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
  date_format: z.enum(['full', 'month_year', 'year_only']).default('month_year'),
  section_order: z.array(z.string()).default([
    'contact',
    'summary',
    'experience',
    'skills',
    'projects',
    'education',
    'certifications',
    'extracurriculars',
  ]),
  hidden_sections: z.array(z.string()).default([]),
  page_limit: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
})

export type ResumeSettingsFormValues = z.infer<typeof resumeSettingsSchema>

// ===== Create Resume =====
export const createResumeSchema = z.object({
  title: z.string().min(1, 'Resume title is required'),
  experience_level: z.enum([
    'intern',
    'new_grad',
    'bootcamp_grad',
    'junior',
    'mid',
    'senior',
    'staff_plus',
    'tech_lead',
    'eng_manager',
  ]),
  target_role: z.string().optional(),
  template_id: z.string().optional(),
  is_master: z.boolean().default(false),
})

export type CreateResumeFormValues = z.infer<typeof createResumeSchema>

// ===== Job Application =====
export const jobApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status: z
    .enum([
      'saved',
      'applied',
      'phone_screen',
      'technical',
      'onsite',
      'offer',
      'accepted',
      'rejected',
      'withdrawn',
    ])
    .default('saved'),
  applied_date: z.string().optional(),
  notes: z.string().optional(),
  salary_min: z.number().optional().nullable(),
  salary_max: z.number().optional().nullable(),
  salary_currency: z.string().default('USD'),
  location: z.string().optional(),
  remote_type: z.enum(['remote', 'hybrid', 'onsite']).optional().nullable(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().or(z.literal('')).optional(),
  resume_id: z.string().optional().nullable(),
})

export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>
