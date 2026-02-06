# 06 — SEO Optimization

## Goal

Rank on page 1 for targeted keywords like "[Your Name] developer", "[Your Name] portfolio", and ideally for niche long-tail terms like "senior fullstack developer [city]" or blog-specific keywords.

## Technical SEO Foundations

### 1. Metadata API (Next.js 16)

Every page must export proper metadata using Next.js `generateMetadata()`:

```typescript
// /app/(public)/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings() // from Supabase
  const hero = await getHeroSection()

  return {
    title: `${hero.name} — ${hero.rotating_titles[0]}`,
    description: settings.site_description,
    keywords: ['full-stack developer', 'software engineer', hero.name, ...],
    authors: [{ name: hero.name, url: settings.site_url }],
    creator: hero.name,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: settings.site_url,
      title: `${hero.name} — ${hero.rotating_titles[0]}`,
      description: settings.site_description,
      siteName: hero.name,
      images: [{ url: settings.og_image_url, width: 1200, height: 630, alt: hero.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${hero.name} — ${hero.rotating_titles[0]}`,
      description: settings.site_description,
      images: [settings.og_image_url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: settings.site_url,
    },
  }
}
```

### Blog Post Metadata

Each blog post gets unique metadata:

```typescript
// /app/(public)/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      type: 'article',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: [{ url: post.og_image_url || post.cover_image_url }],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      tags: post.tags,
      authors: [heroName],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: [post.og_image_url || post.cover_image_url],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
  }
}
```

### 2. JSON-LD Structured Data

Add JSON-LD to every page for rich search results:

**Home page** — `Person` + `WebSite`:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Sean [Last Name]",
  "jobTitle": "Senior Full-Stack Software Developer",
  "url": "https://yourdomain.com",
  "sameAs": [
    "https://github.com/username",
    "https://linkedin.com/in/username"
  ],
  "knowsAbout": ["React", "Next.js", "TypeScript", "Node.js", ...],
  "image": "https://yourdomain.com/avatar.jpg"
}
```

**Blog posts** — `Article`:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post Title",
  "description": "Post excerpt",
  "image": "cover-image-url",
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-20",
  "author": {
    "@type": "Person",
    "name": "Sean [Last Name]",
    "url": "https://yourdomain.com"
  },
  "publisher": {
    "@type": "Person",
    "name": "Sean [Last Name]"
  }
}
```

**Blog listing** — `CollectionPage`:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Blog",
  "description": "Articles about software development...",
  "url": "https://yourdomain.com/blog"
}
```

**Resume page** — `ProfilePage`:
```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Sean [Last Name]",
    "jobTitle": "Senior Full-Stack Software Developer",
    ...
  }
}
```

### Implementation

Create a reusable component:

```typescript
// /components/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### 3. Sitemap

Generate dynamic sitemap from database content:

```typescript
// /app/sitemap.ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedBlogPosts()
  
  const blogUrls = posts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/resume`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...blogUrls,
  ]
}
```

### 4. Robots.txt

```typescript
// /app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

### 5. Canonical URLs

Every page must have a canonical URL to prevent duplicate content:
- Set via `metadata.alternates.canonical`
- Important for blog posts (prevent `/blog/my-post` and `/blog/my-post/` from being separate pages)

### 6. Image Optimization

- ALL images through `next/image` component
- Provide `width`, `height`, and `alt` attributes on every image
- Use WebP format for uploads (convert on upload)
- Lazy load below-fold images (`loading="lazy"` — default in next/image)
- Eager load above-fold images (hero, first project) with `priority` prop
- Provide `sizes` attribute for responsive images

### 7. Performance (Core Web Vitals)

These directly impact SEO ranking:

**LCP (Largest Contentful Paint) < 2.5s**:
- Preload hero image with `priority` in next/image
- Use `<link rel="preload">` for critical fonts
- Server Components for instant HTML (no client JS waterfall)
- Supabase queries cached via Next.js cache

**FID/INP (Interaction to Next Paint) < 200ms**:
- Minimize client-side JavaScript
- Use Server Components by default, Client Components only where needed
- Lazy load animation libraries (GSAP, Motion) — don't import in Server Components
- Use `dynamic()` import for heavy components below the fold

**CLS (Cumulative Layout Shift) < 0.1**:
- Set explicit `width`/`height` on all images
- Reserve space for dynamic content (skeleton loaders)
- Don't inject content above existing content after load
- Font `font-display: swap` with size-adjusted fallback

### 8. Semantic HTML

- Use proper heading hierarchy (`h1` → `h2` → `h3`, one `h1` per page)
- Use `<article>` for blog posts
- Use `<nav>` for navigation
- Use `<main>` for main content
- Use `<section>` with `aria-label` for page sections
- Use `<time datetime="...">` for dates
- Use `<address>` for contact information

### 9. Accessibility (Also Impacts SEO)

- All images have descriptive `alt` text
- Color contrast ratio ≥ 4.5:1 for text
- Keyboard navigable (tab order, focus indicators)
- ARIA labels on interactive elements
- Skip-to-content link
- `lang="en"` on `<html>`

### 10. Blog SEO Strategy

**Content is king for SEO.** The blog is your primary SEO driver:

- **Write about what you know** — Technical articles about your stack (React, Next.js, TypeScript, Java, healthcare tech, FinTech)
- **Target long-tail keywords** — "How to optimize Next.js 16 for production", "DuckDB vs PostgreSQL for analytics", etc.
- **Include code examples** — Google indexes code blocks and shows them in search
- **Internal linking** — Link between blog posts and to your projects section
- **Consistent publishing** — Even 1-2 posts/month helps
- **Proper heading hierarchy in posts** — H1 (title), H2 (sections), H3 (subsections)
- **Meta description for every post** — 150-160 characters, include target keyword
- **URL structure**: `/blog/descriptive-slug-with-keywords`

### 11. Social Sharing Optimization

- OG image for every page (1200×630px recommended)
- Twitter card meta tags
- Create a default OG image template that auto-generates per page (use `@vercel/og` or a canvas-based solution)
- Test with:
  - https://cards-dev.twitter.com/validator
  - https://developers.facebook.com/tools/debug/
  - https://www.opengraph.xyz/

### 12. RSS Feed for Blog

```typescript
// /app/blog/feed.xml/route.ts
export async function GET() {
  const posts = await getPublishedBlogPosts()
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Blog Title</title>
        <link>${siteUrl}/blog</link>
        <description>Blog description</description>
        <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
        ${posts.map(post => `
          <item>
            <title>${escapeXml(post.title)}</title>
            <link>${siteUrl}/blog/${post.slug}</link>
            <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
            <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
            <description>${escapeXml(post.excerpt)}</description>
          </item>
        `).join('')}
      </channel>
    </rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

Add RSS auto-discovery to the blog layout:
```typescript
// In blog layout metadata
alternates: {
  types: {
    'application/rss+xml': `${siteUrl}/blog/feed.xml`,
  },
}
```

### 13. Admin SEO Controls

In the admin Settings page, provide:
- Default site title template: `{page} — {site_name}`
- Default meta description
- Default OG image
- Google Analytics ID
- Google Search Console verification meta tag
- Per-page SEO overrides (meta title, description) in each content editor

In the blog editor, provide:
- SEO preview card (shows how the post appears in Google search results)
- Character count for meta title (< 60 chars) and description (< 160 chars)
- Slug editor with guidelines
- OG image override

### 14. Post-Launch Checklist

After deployment:
1. Submit sitemap to Google Search Console (`sitemap.xml`)
2. Submit sitemap to Bing Webmaster Tools
3. Verify custom domain in Google Search Console
4. Set up Google Analytics (via the admin settings GA ID)
5. Test all pages with Lighthouse (target 95+ on all metrics)
6. Test with Google's Rich Results Test (validate JSON-LD)
7. Test OG images with social platform debuggers
8. Monitor Core Web Vitals in Search Console
9. Set up Vercel Analytics (built-in with Vercel Pro)
