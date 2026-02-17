import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { getBlogPost, getAdjacentPosts } from "@/lib/queries"
import { getCachedSiteConfig } from "@/lib/seo"
import { articleJsonLd } from "@/lib/json-ld"
import { JsonLd } from "@/components/JsonLd"
import { Badge } from "@/components/ui/badge"
import { BlogRenderer } from "@/components/blog/blog-renderer"
import { TableOfContents } from "./table-of-contents"
import { ShareButtons } from "./share-buttons"

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("blog_posts").select("slug").eq("published", true)
  return (data ?? []).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [post, config] = await Promise.all([getBlogPost(slug), getCachedSiteConfig()])
  if (!post) return {}

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ""
  const ogImage = post.og_image_url || post.cover_image_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      tags: post.tags,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: {
      canonical: config ? `${config.siteUrl}/blog/${slug}` : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  const config = await getCachedSiteConfig()

  const adjacent = post.published_at
    ? await getAdjacentPosts(post.published_at)
    : { prev: null, next: null }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <main className="min-h-screen pt-24 pb-16">
      {config && (
        <JsonLd data={articleJsonLd(post, { name: config.name, siteUrl: config.siteUrl })} />
      )}
      {/* Cover image */}
      {post.cover_image_url && (
        <div className="container-wide mb-10">
          <div className="aspect-[2.5/1] overflow-hidden rounded-2xl">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={1200}
              height={480}
              className="h-full w-full object-cover"
              priority
              unoptimized
            />
          </div>
        </div>
      )}

      <div className="container-wide">
        {/* Back link */}
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1 className="mb-4 text-[length:var(--text-4xl)] leading-tight font-bold">
            {post.title}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            {formattedDate && <time dateTime={post.published_at ?? ""}>{formattedDate}</time>}
            {post.read_time_minutes && (
              <>
                <span className="bg-muted-foreground h-1 w-1 rounded-full" />
                <span>{post.read_time_minutes} min read</span>
              </>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Content + TOC layout */}
        <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
          <article>
            <BlogRenderer content={post.content} />

            {/* Share buttons */}
            <div className="mt-10 border-t pt-6">
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </article>

          {/* Table of contents — sticky sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents content={post.content} />
          </aside>
        </div>

        {/* Previous / Next navigation */}
        <nav className="mt-12 grid gap-4 border-t pt-8 sm:grid-cols-2">
          {adjacent.prev ? (
            <Link
              href={`/blog/${adjacent.prev.slug}`}
              className="group hover:border-primary/30 flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <ChevronLeft className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Previous</p>
                <p className="group-hover:text-primary truncate font-medium transition-colors">
                  {adjacent.prev.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {adjacent.next ? (
            <Link
              href={`/blog/${adjacent.next.slug}`}
              className="group hover:border-primary/30 flex items-center gap-3 rounded-lg border p-4 text-right transition-colors sm:justify-end"
            >
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Next</p>
                <p className="group-hover:text-primary truncate font-medium transition-colors">
                  {adjacent.next.title}
                </p>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </main>
  )
}
