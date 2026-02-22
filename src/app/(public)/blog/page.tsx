import type { Metadata } from "next"
import { getBlogPosts, getAllBlogTags } from "@/lib/queries"
import { getCachedSiteConfig } from "@/lib/seo"
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/json-ld"
import { JsonLd } from "@/components/JsonLd"
import { BlogListing } from "./blog-listing"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig()
  const description = config
    ? `Articles and thoughts by ${config.name} on code, craft, and the modern web.`
    : "Thoughts on code, craft, and the modern web."

  return {
    title: "Blog",
    description,
    openGraph: {
      title: config ? `Blog — ${config.name}` : "Blog",
      description,
    },
    alternates: { canonical: config ? `${config.siteUrl}/blog` : undefined },
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const { page: pageStr, tag } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1)

  const [result, allTags, config] = await Promise.all([
    getBlogPosts(page, tag),
    getAllBlogTags(),
    getCachedSiteConfig(),
  ])

  return (
    <main className="min-h-screen pt-24 pb-16">
      {config && (
        <JsonLd
          data={[
            collectionPageJsonLd(config),
            breadcrumbJsonLd(config.siteUrl, [{ name: "Blog", path: "/blog" }]),
          ]}
        />
      )}
      <div className="container-wide">
        <div className="mb-12">
          <h1 className="mb-3 text-[length:var(--text-4xl)] font-bold">Blog</h1>
          <p className="text-muted-foreground text-lg">Thoughts on code and craft</p>
        </div>
        <BlogListing
          posts={result.posts}
          totalPages={result.totalPages}
          currentPage={page}
          currentTag={tag}
          allTags={allTags}
        />
      </div>
    </main>
  )
}
