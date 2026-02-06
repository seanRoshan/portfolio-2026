"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  tags: string[]
  published_at: string | null
  read_time_minutes: number | null
}

interface BlogListingProps {
  posts: Post[]
  totalPages: number
  currentPage: number
  currentTag?: string
  allTags: string[]
}

function PostCard({ post }: { post: Post }) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="glass hover:border-primary/20 hover:shadow-primary/5 h-full overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
        {post.cover_image_url && (
          <div className="aspect-[2/1] overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={640}
              height={320}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          </div>
        )}
        <div className="p-6">
          <div className="text-muted-foreground mb-3 flex items-center gap-3 text-xs">
            {formattedDate && <time dateTime={post.published_at ?? ""}>{formattedDate}</time>}
            {post.read_time_minutes && (
              <>
                <span className="bg-muted-foreground h-1 w-1 rounded-full" />
                <span>{post.read_time_minutes} min read</span>
              </>
            )}
          </div>
          <h2 className="group-hover:text-primary mb-2 text-xl leading-snug font-semibold transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
              {post.excerpt}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

export function BlogListing({
  posts,
  totalPages,
  currentPage,
  currentTag,
  allTags,
}: BlogListingProps) {
  function buildHref(page: number, tag?: string) {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", String(page))
    if (tag) params.set("tag", tag)
    const qs = params.toString()
    return `/blog${qs ? `?${qs}` : ""}`
  }

  return (
    <div>
      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog">
            <Badge variant={!currentTag ? "default" : "outline"} className="cursor-pointer">
              All
            </Badge>
          </Link>
          {allTags.map((tag) => (
            <Link key={tag} href={buildHref(1, tag)}>
              <Badge
                variant={currentTag === tag ? "default" : "outline"}
                className="cursor-pointer"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Post grid */}
      {posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-16 text-center">
          <p className="text-lg">No posts found</p>
          {currentTag && (
            <Link href="/blog" className="text-primary mt-2 inline-block hover:underline">
              Clear filter
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildHref(currentPage - 1, currentTag)} />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={buildHref(page, currentTag)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildHref(currentPage + 1, currentTag)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
