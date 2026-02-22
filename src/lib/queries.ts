import { createClient } from "@/lib/supabase/server"

/**
 * Server-side data fetching functions.
 * Used in Server Components to fetch content from Supabase.
 * Each function maps DB rows to the shape that existing components expect.
 */

export async function getSiteConfig() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from("site_settings").select("*").single()
  const { data: hero } = await supabase.from("hero_section").select("name, avatar_url").single()

  if (!settings || !hero) return null

  // Build location string from parts
  const locationParts = [settings.city, settings.state, settings.country].filter(Boolean)
  const location = locationParts.join(", ")

  return {
    name: settings.full_name || hero.name,
    title: settings.site_title?.split("—")[1]?.trim() ?? "Developer",
    description: settings.site_description ?? "",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    email: settings.contact_email ?? "",
    phone: settings.phone ?? "",
    location,
    availability: "Open to opportunities",
    socials: (settings.social_links as Record<string, string>) ?? {},
    linkedinUrl: settings.linkedin_url ?? "",
    githubUrl: settings.github_url ?? "",
    portfolioUrl: settings.portfolio_url ?? "",
    linkAnimations: (settings.link_animations as { header: string; footer: string }) ?? {
      header: "underline-slide",
      footer: "underline-slide",
    },
    visibility: {
      email: settings.landing_show_email,
      phone: settings.landing_show_phone,
      location: settings.landing_show_location,
      linkedin: settings.landing_show_linkedin,
      github: settings.landing_show_github,
      portfolio: settings.landing_show_portfolio,
    },
  }
}

export async function getHeroData() {
  const supabase = await createClient()
  const { data } = await supabase.from("hero_section").select("*").single()
  if (!data) return null

  return {
    greeting: data.greeting ?? "Hey, I'm",
    name: data.name,
    roles: data.rotating_titles ?? [],
    tagline: data.description ?? "",
    cta: {
      label: data.cta_primary_text ?? "See My Work",
      href: data.cta_primary_link ?? "#projects",
    },
    ctaSecondary: {
      label: data.cta_secondary_text ?? "Get In Touch",
      href: data.cta_secondary_link ?? "#contact",
    },
  }
}

export async function getAboutData() {
  const supabase = await createClient()
  const { data } = await supabase.from("about_section").select("*").single()
  if (!data) return null

  // Map stats from JSONB [{label, value}] to [{label, value: number}]
  const stats = ((data.stats as Array<{ label: string; value: string }>) ?? []).map((s) => ({
    label: s.label,
    value: parseInt(s.value.replace(/[^0-9]/g, ""), 10) || 0,
  }))

  return {
    headline: data.subheading ?? data.heading ?? "About Me",
    description: [data.bio, data.bio_secondary].filter(Boolean) as string[],
    portraitUrl: data.portrait_url ?? null,
    stats,
    techStack: (data.tech_stack ?? []).map((name: string) => ({ name, category: "" })),
  }
}

export async function getProjectsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      `*,
      project_experiences(experience_id, experience:experience(company, role)),
      project_skills(skill_id, skill:skills(name)),
      project_education(education_id, education:education(school, degree, field)),
      project_certifications(certification_id, certification:certifications(name, issuer))`,
    )
    .eq("published", true)
    .order("sort_order")
  if (!data) return []

  return data.map((p) => {
    // Use linked skills if available, fall back to tech_stack array
    const skillNames =
      (p.project_skills as { skill: { name: string } }[])?.map((ps) => ps.skill.name) ?? []
    const tags = skillNames.length > 0 ? skillNames : (p.tech_stack ?? [])

    const experiences =
      (
        p.project_experiences as {
          experience: { company: string; role: string }
        }[]
      )?.map((pe) => ({
        company: pe.experience.company,
        role: pe.experience.role,
      })) ?? []

    const education =
      (
        p.project_education as {
          education: { school: string; degree: string; field: string | null }
        }[]
      )?.map((pe) => ({
        school: pe.education.school,
        degree: pe.education.degree,
        field: pe.education.field,
      })) ?? []

    const certifications =
      (
        p.project_certifications as {
          certification: { name: string; issuer: string }
        }[]
      )?.map((pc) => ({
        name: pc.certification.name,
        issuer: pc.certification.issuer,
      })) ?? []

    return {
      id: p.slug,
      title: p.title,
      description: p.short_description,
      longDescription: p.long_description ?? "",
      tags,
      image: p.thumbnail_url ?? "",
      images: p.images ?? [],
      imageCaptions: (p.image_captions as Record<string, string>) ?? {},
      architectureUrl: (p.architecture_url as string) ?? null,
      liveUrl: p.live_url ?? "",
      githubUrl: p.github_url ?? "",
      featured: p.featured,
      year: p.year ?? "",
      color: p.color ?? "#6366f1",
      status: (p.status as string) ?? "completed",
      role: (p.project_role as string) ?? null,
      highlights: (p.highlights as { metric: string; value: string }[]) ?? [],
      experiences,
      education,
      certifications,
    }
  })
}

export async function getProjectByIdAdmin(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      `*,
      project_experiences(experience_id),
      project_skills(skill_id),
      project_education(education_id),
      project_certifications(certification_id)`,
    )
    .eq("id", id)
    .single()

  if (!data) return null

  return {
    ...data,
    highlights: (data.highlights as { metric: string; value: string }[]) ?? [],
    image_captions: (data.image_captions as Record<string, string>) ?? {},
    experience_ids:
      (data.project_experiences as { experience_id: string }[])?.map((pe) => pe.experience_id) ??
      [],
    skill_ids: (data.project_skills as { skill_id: string }[])?.map((ps) => ps.skill_id) ?? [],
    education_ids:
      (data.project_education as { education_id: string }[])?.map((pe) => pe.education_id) ?? [],
    certification_ids:
      (data.project_certifications as { certification_id: string }[])?.map(
        (pc) => pc.certification_id,
      ) ?? [],
  }
}

export async function getAllExperiences() {
  const supabase = await createClient()
  const { data } = await supabase.from("experience").select("id, company, role").order("sort_order")
  return data ?? []
}

export async function getAllSkills() {
  const supabase = await createClient()
  const { data } = await supabase.from("skills").select("id, name, category").order("name")
  return data ?? []
}

export async function getAllEducation() {
  const supabase = await createClient()
  const { data } = await supabase.from("education").select("id, school, degree").order("sort_order")
  return data ?? []
}

export async function getAllCertifications() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("certifications")
    .select("id, name, issuer")
    .order("sort_order")
  return data ?? []
}

export async function getSkillsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("skills")
    .select("*")
    .eq("published", true)
    .order("sort_order")
  if (!data) return { categories: [] }

  // Group by category
  const grouped = new Map<string, Array<{ name: string; iconName: string | null }>>()
  const categoryOrder = ["frontend", "backend", "devops", "database", "tools"]
  const categoryLabels: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    devops: "DevOps & Cloud",
    database: "Databases",
    tools: "Tools & Testing",
  }

  for (const skill of data) {
    const cat = skill.category
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push({ name: skill.name, iconName: skill.icon_name })
  }

  // Return categories in a stable order
  return {
    categories: categoryOrder
      .filter((key) => grouped.has(key))
      .map((key) => ({
        name: categoryLabels[key] ?? key,
        key,
        skills: grouped.get(key)!,
      })),
  }
}

function formatDate(d: string) {
  // Parse YYYY-MM-DD directly to avoid timezone shift (UTC midnight → local previous day)
  const [year, month] = d.split("-").map(Number)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[month - 1]} ${year}`
}

export async function getExperienceData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("experience")
    .select("*")
    .eq("published", true)
    .order("sort_order")
  if (!data) return []

  // Group entries by company name to create grouped cards
  const grouped = new Map<
    string,
    {
      company: string
      companyUrl: string
      companyLogoUrl: string | null
      location: string | null
      phases: {
        role: string
        period: string
        employmentType: string
        viaCompany: string | null
        viaCompanyLogoUrl: string | null
        description: string
        achievements: string[]
      }[]
    }
  >()

  for (const e of data) {
    const startStr = formatDate(e.start_date)
    const endStr = e.end_date ? formatDate(e.end_date) : "Present"

    const phase = {
      role: e.role,
      period: `${startStr} — ${endStr}`,
      employmentType: e.employment_type ?? "direct",
      viaCompany: e.via_company ?? null,
      viaCompanyLogoUrl: e.via_company_logo_url ?? null,
      description: e.description ?? "",
      achievements: e.achievements ?? [],
    }

    const existing = grouped.get(e.company)
    if (existing) {
      // Use the latest logo/url/location from any entry
      if (e.company_logo_url) existing.companyLogoUrl = e.company_logo_url
      if (e.company_url) existing.companyUrl = e.company_url
      if (e.location) existing.location = e.location
      existing.phases.push(phase)
    } else {
      grouped.set(e.company, {
        company: e.company,
        companyUrl: e.company_url ?? "",
        companyLogoUrl: e.company_logo_url ?? null,
        location: e.location ?? null,
        phases: [phase],
      })
    }
  }

  return Array.from(grouped.values())
}

export async function getBlogData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, tags, published_at, read_time_minutes")
    .eq("published", true)
    .order("published_at", { ascending: false })
  if (!data) return []

  return data.map((post) => ({
    title: post.title,
    excerpt: post.excerpt ?? "",
    date: post.published_at ? new Date(post.published_at).toISOString().split("T")[0] : "",
    readTime: post.read_time_minutes ? `${post.read_time_minutes} min` : "5 min",
    tags: post.tags ?? [],
    slug: post.slug,
  }))
}

export async function getBlogPost(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single()
  return data
}

export async function getBlogPosts(page = 1, tag?: string) {
  const perPage = 10
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, tags, published_at, read_time_minutes", {
      count: "exact",
    })
    .eq("published", true)
    .order("published_at", { ascending: false })
    .range(from, to)

  if (tag) {
    query = query.contains("tags", [tag])
  }

  const { data, count } = await query
  return {
    posts: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
    page,
  }
}

export async function getAdjacentPosts(publishedAt: string) {
  const supabase = await createClient()
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("published", true)
      .lt("published_at", publishedAt)
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("published", true)
      .gt("published_at", publishedAt)
      .order("published_at", { ascending: true })
      .limit(1)
      .single(),
  ])
  return { prev, next }
}

export async function getAllBlogTags() {
  const supabase = await createClient()
  const { data } = await supabase.from("blog_posts").select("tags").eq("published", true)
  if (!data) return []

  const tagSet = new Set<string>()
  for (const post of data) {
    for (const tag of post.tags ?? []) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

export async function getResumeData() {
  const supabase = await createClient()
  const { data } = await supabase.from("resume").select("*").single()
  return data
}

export async function getResumeSkills() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("skills")
    .select("*")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")
  if (!data) return []

  // Group by category
  const grouped = new Map<string, string[]>()
  for (const skill of data) {
    if (!grouped.has(skill.category)) grouped.set(skill.category, [])
    grouped.get(skill.category)!.push(skill.name)
  }

  return Array.from(grouped.entries()).map(([category, skills]) => ({
    category,
    skills,
  }))
}

export async function getResumeExperience() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("experience")
    .select("*")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")
  if (!data) return []

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  return data.map((e) => {
    const start = new Date(e.start_date)
    const startStr = `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    const endStr = e.end_date
      ? `${monthNames[new Date(e.end_date).getMonth()]} ${new Date(e.end_date).getFullYear()}`
      : "Present"

    return {
      id: e.id,
      company: e.company,
      role: e.role,
      location: e.location,
      period: `${startStr} – ${endStr}`,
      description: e.description,
      achievements: e.resume_achievements ?? e.achievements ?? [],
      company_url: e.company_url,
    }
  })
}

export async function getResumeEducation() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("education")
    .select("*")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")
  if (!data) return []

  return data.map((e) => ({
    school: e.school,
    degree: e.degree,
    field: e.field,
    year: e.year,
    details: e.details,
  }))
}

export async function getResumeCertifications() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("certifications")
    .select("*")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")
  if (!data) return []

  return data.map((c) => ({
    name: c.name,
    issuer: c.issuer,
    year: c.year,
    url: c.url,
  }))
}

export async function getEducationData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("education")
    .select("*")
    .eq("published", true)
    .order("sort_order")
  if (!data) return []

  return data.map((e) => ({
    school: e.school,
    degree: e.degree,
    field: e.field as string | null,
    year: e.year as string | null,
    details: e.details as string | null,
    logoUrl: e.logo_url as string | null,
  }))
}

export async function getCertificationData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("certifications")
    .select("*")
    .eq("published", true)
    .order("sort_order")
  if (!data) return []

  return data.map((c) => ({
    name: c.name,
    issuer: c.issuer,
    year: c.year as string | null,
    url: c.url as string | null,
    badgeUrl: c.badge_url as string | null,
  }))
}

export async function getVenturesData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ventures")
    .select("*")
    .eq("published", true)
    .order("sort_order")
  if (!data) return []

  return data.map((v) => ({
    name: v.name as string,
    role: v.role as string,
    url: v.url as string | null,
    iconUrl: v.icon_url as string | null,
    iconUrlDark: v.icon_url_dark as string | null,
    foundedYear: v.founded_year as string | null,
  }))
}

export async function getNavLinks() {
  // Navigation links are static — no need to fetch from DB
  return [
    { label: "About", href: "#about" },
    { label: "Ventures", href: "#ventures" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Credentials", href: "#credentials" },
    { label: "Blog", href: "#blog" },
    { label: "Resume", href: "/resume" },
    { label: "Contact", href: "#contact" },
  ]
}
