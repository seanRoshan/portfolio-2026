"use client"

import Link from "next/link"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { StaggerChildren } from "@/components/animations/StaggerChildren"
import { Badge } from "@/components/ui/badge"

interface BlogPost {
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  slug: string
}

interface BlogProps {
  blogData: BlogPost[]
}

function BlogCard({ post }: { post: BlogPost }) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <article className="group cursor-pointer">
        <div className="glass hover:border-primary/20 hover:shadow-primary/5 h-full rounded-2xl p-6 transition-all duration-500 hover:shadow-lg">
          {/* Date & reading time */}
          <div className="text-muted-foreground mb-4 flex items-center gap-3 text-xs">
            <time dateTime={post.date}>{formattedDate}</time>
            <span className="bg-muted-foreground h-1 w-1 rounded-full" />
            <span>{post.readTime} read</span>
          </div>

          {/* Title */}
          <h3 className="group-hover:text-primary mb-3 text-[length:var(--text-lg)] leading-snug font-semibold transition-colors">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{post.excerpt}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Read more arrow */}
          <div className="text-primary mt-4 flex items-center gap-2 text-sm font-medium opacity-0 transition-all duration-300 group-hover:opacity-100">
            Read Article
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function Blog({ blogData }: BlogProps) {
  return (
    <section id="blog" className="section-padding relative">
      <div className="container-wide">
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            Writing
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-2xl text-[length:var(--text-4xl)] leading-tight font-bold"
        >
          Thoughts on code and craft
        </TextReveal>

        <StaggerChildren className="grid gap-6 md:grid-cols-2">
          {blogData.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </StaggerChildren>

        <RevealOnScroll>
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              View All Posts
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
