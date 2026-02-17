import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/resume`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ]

  // Dynamic: published blog posts
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, cover_image_url")
    .eq("published", true)
    .order("published_at", { ascending: false })

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    ...(post.cover_image_url && { images: [post.cover_image_url] }),
  }))

  return [...staticPages, ...blogPages]
}
