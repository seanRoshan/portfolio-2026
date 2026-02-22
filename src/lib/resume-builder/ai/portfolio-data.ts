import { createClient } from '@/lib/supabase/server'

/**
 * Shape of all portfolio data fetched from Supabase for AI consumption.
 * Used by the AI tailoring service to auto-populate tailored resumes
 * from the user's existing portfolio content.
 */
export interface PortfolioData {
  name: string
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  github: string | null
  website: string | null
  blog: string | null
  bio: string | null
  experiences: Array<{
    company: string
    role: string
    location: string | null
    start_date: string
    end_date: string | null
    achievements: string[]
    employment_type: string
    via_company: string | null
    resume_achievements: string[] | null
  }>
  skills: Array<{ name: string; category: string }>
  education: Array<{
    school: string
    degree: string
    field: string | null
    year: string | null
    details: string | null
  }>
  certifications: Array<{
    name: string
    issuer: string
    year: string | null
  }>
  projects: Array<{
    title: string
    short_description: string
    tech_stack: string[]
    live_url: string | null
    github_url: string | null
    highlights: { metric: string; value: string }[]
    long_description: string | null
    project_role: string | null
  }>
  ventures: Array<{
    name: string
    role: string
    description: string | null
    founded_year: string | null
    url: string | null
  }>
}

/**
 * Fetches ALL portfolio data from Supabase in parallel for AI consumption.
 * Used to provide full context when generating tailored resumes.
 *
 * Prefers `resume` table data for contact info, falls back to hero/settings if null.
 */
export async function fetchPortfolioData(): Promise<PortfolioData> {
  const supabase = await createClient()

  // Use Promise.allSettled so one table failure doesn't kill the entire fetch
  const results = await Promise.allSettled([
    supabase.from('hero_section').select('name').single(),
    supabase.from('about_section').select('bio').single(),
    supabase.from('site_settings').select('contact_email, social_links').single(),
    supabase
      .from('resume')
      .select('full_name, email, phone, location, website, linkedin, github')
      .maybeSingle(),
    supabase
      .from('experience')
      .select(
        'company, role, location, start_date, end_date, achievements, employment_type, via_company, resume_achievements'
      )
      .eq('published', true)
      .order('start_date', { ascending: false }),
    supabase
      .from('skills')
      .select('name, category')
      .eq('published', true)
      .order('sort_order'),
    supabase
      .from('education')
      .select('school, degree, field, year, details')
      .eq('published', true)
      .order('sort_order'),
    supabase
      .from('certifications')
      .select('name, issuer, year')
      .eq('published', true)
      .order('sort_order'),
    supabase
      .from('projects')
      .select('title, short_description, tech_stack, live_url, github_url, highlights, project_role, long_description')
      .eq('published', true)
      .order('sort_order'),
    supabase
      .from('ventures')
      .select('name, role, description, founded_year, url')
      .eq('published', true)
      .order('sort_order'),
  ])

  // Extract data safely from settled results
  const getData = <T>(idx: number): T | null => {
    const r = results[idx]
    if (r.status === 'fulfilled') return (r.value as { data: T }).data
    return null
  }
  const hero = getData<{ name: string }>(0)
  const about = getData<{ bio: string }>(1)
  const settings = getData<{ contact_email: string; social_links: Record<string, string> }>(2)
  const resume = getData<{ full_name: string; email: string; phone: string; location: string; website: string; linkedin: string; github: string }>(3)
  const experience = getData<Array<Record<string, unknown>>>(4) ?? []
  const skills = getData<Array<Record<string, unknown>>>(5) ?? []
  const education = getData<Array<Record<string, unknown>>>(6) ?? []
  const certifications = getData<Array<Record<string, unknown>>>(7) ?? []
  const projects = getData<Array<Record<string, unknown>>>(8) ?? []
  const ventures = getData<Array<Record<string, unknown>>>(9) ?? []

  const socialLinks = (settings?.social_links ?? {}) as Record<string, string>

  // Prefer resume table data, fall back to hero/settings
  const name = resume?.full_name ?? hero?.name ?? ''
  const emailAddr = resume?.email ?? settings?.contact_email ?? null

  return {
    name,
    email: emailAddr,
    phone: resume?.phone ?? null,
    location: resume?.location ?? null,
    linkedin: resume?.linkedin ?? socialLinks.linkedin ?? null,
    github: resume?.github ?? socialLinks.github ?? null,
    website: resume?.website ?? socialLinks.website ?? null,
    blog: socialLinks.blog ?? null,
    bio: about?.bio ?? null,
    experiences: experience.map((e) => ({
      company: e.company as string,
      role: e.role as string,
      location: (e.location as string | null) ?? null,
      start_date: e.start_date as string,
      end_date: (e.end_date as string | null) ?? null,
      achievements: (e.achievements as string[]) ?? [],
      employment_type: (e.employment_type as string) ?? 'direct',
      via_company: (e.via_company as string | null) ?? null,
      resume_achievements: (e.resume_achievements as string[] | null) ?? null,
    })),
    skills: skills.map((s) => ({
      name: s.name as string,
      category: s.category as string,
    })),
    education: education.map((e) => ({
      school: e.school as string,
      degree: e.degree as string,
      field: (e.field as string | null) ?? null,
      year: (e.year as string | null) ?? null,
      details: (e.details as string | null) ?? null,
    })),
    certifications: certifications.map((c) => ({
      name: c.name as string,
      issuer: c.issuer as string,
      year: (c.year as string | null) ?? null,
    })),
    projects: projects.map((p) => ({
      title: p.title as string,
      short_description: p.short_description as string,
      tech_stack: (p.tech_stack as string[]) ?? [],
      live_url: (p.live_url as string | null) ?? null,
      github_url: (p.github_url as string | null) ?? null,
      highlights: (p.highlights as { metric: string; value: string }[]) ?? [],
      long_description: (p.long_description as string | null) ?? null,
      project_role: (p.project_role as string | null) ?? null,
    })),
    ventures: ventures.map((v) => ({
      name: v.name as string,
      role: v.role as string,
      description: (v.description as string | null) ?? null,
      founded_year: (v.founded_year as string | null) ?? null,
      url: (v.url as string | null) ?? null,
    })),
  }
}
