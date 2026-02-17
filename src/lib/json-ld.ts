import type { SiteConfig } from "@/lib/seo"

/**
 * Person + WebSite schema for the home page.
 */
export function personAndWebsiteJsonLd(config: SiteConfig) {
  const sameAs = Object.values(config.socials).filter(Boolean)

  return [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${config.siteUrl}/#person`,
      name: config.name,
      alternateName: "Shahriyar Valielahiroshan",
      url: config.siteUrl,
      jobTitle: "Software Engineer",
      knowsAbout: [
        "Software Engineering",
        "Web Development",
        "TypeScript",
        "React",
        "Next.js",
      ],
      ...(config.avatarUrl && { image: config.avatarUrl }),
      ...(config.siteDescription && { description: config.siteDescription }),
      ...(sameAs.length > 0 && { sameAs }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${config.siteUrl}/#website`,
      name: config.siteTitle,
      url: config.siteUrl,
      ...(config.siteDescription && { description: config.siteDescription }),
    },
  ]
}

/**
 * Article schema for individual blog posts.
 */
export function articleJsonLd(
  post: {
    title: string
    slug: string
    excerpt?: string | null
    published_at?: string | null
    updated_at?: string | null
    cover_image_url?: string | null
    tags?: string[]
  },
  author: { name: string; siteUrl: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: `${author.siteUrl}/blog/${post.slug}`,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.updated_at && { dateModified: post.updated_at }),
    ...(post.cover_image_url && { image: post.cover_image_url }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(", ") }),
    author: {
      "@type": "Person",
      name: author.name,
      url: author.siteUrl,
    },
  }
}

/**
 * CollectionPage schema for the blog index.
 */
export function collectionPageJsonLd(config: SiteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Blog — ${config.name}`,
    url: `${config.siteUrl}/blog`,
    description: `Articles and thoughts by ${config.name}`,
    isPartOf: {
      "@type": "WebSite",
      name: config.siteTitle,
      url: config.siteUrl,
    },
  }
}

/**
 * ProfilePage schema for the resume page.
 */
export function profilePageJsonLd(config: SiteConfig) {
  const sameAs = Object.values(config.socials).filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `Resume — ${config.name}`,
    url: `${config.siteUrl}/resume`,
    mainEntity: {
      "@type": "Person",
      name: config.name,
      url: config.siteUrl,
      ...(config.siteDescription && { description: config.siteDescription }),
      ...(sameAs.length > 0 && { sameAs }),
    },
  }
}
