import { createClient } from "@/lib/supabase/server";

/**
 * Server-side data fetching functions.
 * Used in Server Components to fetch content from Supabase.
 * Each function maps DB rows to the shape that existing components expect.
 */

export async function getSiteConfig() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .single();
  const { data: hero } = await supabase
    .from("hero_section")
    .select("name, avatar_url")
    .single();

  if (!settings || !hero) return null;

  return {
    name: hero.name,
    title: settings.site_title?.split("—")[1]?.trim() ?? "Developer",
    description: settings.site_description ?? "",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    email: settings.contact_email ?? "",
    location: "",
    availability: "Open to opportunities",
    socials: (settings.social_links as Record<string, string>) ?? {},
  };
}

export async function getHeroData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hero_section")
    .select("*")
    .single();
  if (!data) return null;

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
  };
}

export async function getAboutData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("about_section")
    .select("*")
    .single();
  if (!data) return null;

  // Map stats from JSONB [{label, value}] to [{label, value: number}]
  const stats = ((data.stats as Array<{ label: string; value: string }>) ?? []).map((s) => ({
    label: s.label,
    value: parseInt(s.value.replace(/[^0-9]/g, ""), 10) || 0,
  }));

  return {
    headline: data.subheading ?? data.heading ?? "About Me",
    description: [data.bio, data.bio_secondary].filter(Boolean) as string[],
    stats,
    techStack: (data.tech_stack ?? []).map((name: string) => ({ name, category: "" })),
  };
}

export async function getProjectsData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (!data) return [];

  return data.map((p) => ({
    id: p.slug,
    title: p.title,
    description: p.short_description,
    longDescription: p.long_description ?? "",
    tags: p.tech_stack ?? [],
    image: p.thumbnail_url ?? `/projects/${p.slug}.jpg`,
    liveUrl: p.live_url ?? "",
    githubUrl: p.github_url ?? "",
    featured: p.featured,
    year: p.year ?? "",
    color: p.color ?? "#6366f1",
  }));
}

export async function getSkillsData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (!data) return { categories: [] };

  // Group by category
  const grouped = new Map<string, Array<{ name: string; level: number }>>();
  const categoryLabels: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    devops: "DevOps & Cloud",
    database: "Databases",
    tools: "Tools",
  };

  for (const skill of data) {
    const cat = skill.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    // Temporarily keep a default level — will be removed in skills redesign (#5)
    grouped.get(cat)!.push({ name: skill.name, level: 85 });
  }

  return {
    categories: Array.from(grouped.entries()).map(([key, skills]) => ({
      name: categoryLabels[key] ?? key,
      skills,
    })),
  };
}

export async function getExperienceData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("experience")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (!data) return [];

  return data.map((e) => {
    const start = new Date(e.start_date);
    const startYear = start.getFullYear();
    const endStr = e.end_date
      ? new Date(e.end_date).getFullYear().toString()
      : "Present";

    return {
      role: e.role,
      company: e.company,
      companyUrl: e.company_url ?? "",
      period: `${startYear} — ${endStr}`,
      description: e.description ?? "",
      achievements: e.achievements ?? [],
    };
  });
}

export async function getBlogData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "title, slug, excerpt, tags, published_at, read_time_minutes"
    )
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (!data) return [];

  return data.map((post) => ({
    title: post.title,
    excerpt: post.excerpt ?? "",
    date: post.published_at
      ? new Date(post.published_at).toISOString().split("T")[0]
      : "",
    readTime: post.read_time_minutes
      ? `${post.read_time_minutes} min`
      : "5 min",
    tags: post.tags ?? [],
    slug: post.slug,
  }));
}

export async function getBlogPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return data;
}

export async function getBlogPosts(page = 1, tag?: string) {
  const perPage = 10;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = await createClient();
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, tags, published_at, read_time_minutes", { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, count } = await query;
  return {
    posts: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / perPage),
    page,
  };
}

export async function getAdjacentPosts(publishedAt: string) {
  const supabase = await createClient();
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
  ]);
  return { prev, next };
}

export async function getAllBlogTags() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("published", true);
  if (!data) return [];

  const tagSet = new Set<string>();
  for (const post of data) {
    for (const tag of post.tags ?? []) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export async function getNavLinks() {
  // Navigation links are static — no need to fetch from DB
  return [
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Blog", href: "#blog" },
    { label: "Contact", href: "#contact" },
  ];
}
