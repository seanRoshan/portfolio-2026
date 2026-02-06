import { cache } from "react"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export interface SiteConfig {
  siteTitle: string
  siteDescription: string
  ogImageUrl: string
  googleAnalyticsId: string
  socials: Record<string, string>
  avatarUrl: string
  name: string
  siteUrl: string
}

/**
 * Cached site config fetcher — deduplicates Supabase calls within a single request.
 * Safe to call from both generateMetadata() and page components.
 */
export const getCachedSiteConfig = cache(async (): Promise<SiteConfig | null> => {
  const supabase = await createClient()
  const [{ data: settings }, { data: hero }] = await Promise.all([
    supabase.from("site_settings").select("*").single(),
    supabase.from("hero_section").select("name, avatar_url").single(),
  ])

  if (!settings || !hero) return null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  return {
    siteTitle: settings.site_title ?? "",
    siteDescription: settings.site_description ?? "",
    ogImageUrl: settings.og_image_url ?? "",
    googleAnalyticsId: settings.google_analytics_id ?? "",
    socials: (settings.social_links as Record<string, string>) ?? {},
    avatarUrl: hero.avatar_url ?? "",
    name: hero.name ?? "",
    siteUrl,
  }
})

/**
 * Builds the root metadata object for the site.
 * Used in app/layout.tsx generateMetadata().
 */
export async function buildRootMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig()

  if (!config) {
    return {
      title: "Portfolio",
      description: "Personal portfolio website",
    }
  }

  const { siteTitle, siteDescription, ogImageUrl, name, siteUrl } = config

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: {
      default: siteTitle,
      template: `%s — ${name}`,
    },
    description: siteDescription,
    authors: [{ name }],
    creator: name,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl || undefined,
      siteName: name,
      title: siteTitle,
      description: siteDescription,
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteTitle }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      types: {
        "application/rss+xml": "/blog/feed.xml",
      },
    },
  }
}
