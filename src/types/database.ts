// TypeScript interfaces matching the Supabase database schema exactly

export interface SiteSettings {
  id: string
  site_title: string
  site_description: string | null
  og_image_url: string | null
  favicon_url: string | null
  google_analytics_id: string | null
  social_links: Record<string, string>
  contact_email: string | null
  contact_form_enabled: boolean
  maintenance_mode: boolean
  created_at: string
  updated_at: string
}

export interface HeroSection {
  id: string
  greeting: string | null
  name: string
  rotating_titles: string[]
  description: string | null
  cta_primary_text: string | null
  cta_primary_link: string | null
  cta_secondary_text: string | null
  cta_secondary_link: string | null
  avatar_url: string | null
  resume_url: string | null
  updated_at: string
}

export interface AboutSection {
  id: string
  heading: string | null
  subheading: string | null
  bio: string
  bio_secondary: string | null
  portrait_url: string | null
  stats: { label: string; value: string }[]
  tech_stack: string[]
  updated_at: string
}

export interface Project {
  id: string
  title: string
  slug: string
  short_description: string
  long_description: string | null
  thumbnail_url: string | null
  images: string[]
  tech_stack: string[]
  color: string | null
  year: string | null
  live_url: string | null
  github_url: string | null
  featured: boolean
  sort_order: number
  published: boolean
  architecture_url: string | null
  project_role: string | null
  status: "completed" | "in_progress" | "open_source" | null
  highlights: { metric: string; value: string }[]
  image_captions: Record<string, string>
  created_at: string
  updated_at: string
}

export interface ProjectWithRelations extends Project {
  experience_ids: string[]
  skill_ids: string[]
  education_ids: string[]
  certification_ids: string[]
}

export interface ProjectExperience {
  id: string
  project_id: string
  experience_id: string
  created_at: string
}

export interface ProjectSkill {
  id: string
  project_id: string
  skill_id: string
  created_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
  icon_name: string | null
  icon_url: string | null
  sort_order: number
  published: boolean
  show_on_resume: boolean
  created_at: string
}

export interface Experience {
  id: string
  company: string
  role: string
  location: string | null
  start_date: string
  end_date: string | null
  description: string | null
  achievements: string[]
  company_logo_url: string | null
  company_url: string | null
  sort_order: number
  published: boolean
  show_on_resume: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  tags: string[]
  published: boolean
  published_at: string | null
  read_time_minutes: number | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  created_at: string
  updated_at: string
}

export interface EducationEntry {
  school: string
  degree: string
  field: string | null
  year: string | null
  details: string | null
}

export interface CertificationEntry {
  name: string
  issuer: string
  year: string | null
  url: string | null
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string | null
  year: string | null
  details: string | null
  logo_url: string | null
  sort_order: number
  published: boolean
  show_on_resume: boolean
  created_at: string
  updated_at: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  year: string | null
  url: string | null
  badge_url: string | null
  sort_order: number
  published: boolean
  show_on_resume: boolean
  created_at: string
  updated_at: string
}

export interface AdditionalSectionEntry {
  title: string
  items: string[]
}

export interface Resume {
  id: string
  full_name: string
  title: string
  email: string | null
  phone: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
  summary: string | null
  education: EducationEntry[]
  certifications: CertificationEntry[]
  additional_sections: AdditionalSectionEntry[]
  pdf_url: string | null
  updated_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  created_at: string
}
