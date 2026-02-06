import type { Metadata } from "next"
import { getBlogPosts, getAllBlogTags } from "@/lib/queries"
import { BlogListing } from "./blog-listing"

export const metadata: Metadata = {
  title: "Blog — Alex Rivera",
  description:
    "Thoughts on code, craft, and the modern web. Articles about React, TypeScript, architecture, and more.",
  openGraph: {
    title: "Blog — Alex Rivera",
    description: "Thoughts on code, craft, and the modern web.",
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const { page: pageStr, tag } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1)

  const [result, allTags] = await Promise.all([getBlogPosts(page, tag), getAllBlogTags()])

  return (
    <main className="min-h-screen pt-24 pb-16">
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
