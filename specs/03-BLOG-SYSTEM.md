# 03 — Blog System

## Overview

A full-featured blog with rich text editing, media uploads, YouTube video embeds, SEO per post, and a beautiful public reading experience.

## Rich Text Editor: Tiptap (Recommended over Syncfusion)

### Why Tiptap instead of Syncfusion?

| Factor                        | Tiptap                                   | Syncfusion RichTextEditor         |
| ----------------------------- | ---------------------------------------- | --------------------------------- |
| **License**                   | Free (open-source core)                  | Requires commercial license ($$$) |
| **React/Next.js integration** | First-class React support, SSR-safe      | Heavier, potential SSR issues     |
| **Customization**             | Fully extensible node/mark system        | Config-based, less flexible       |
| **Output format**             | HTML or JSON (both supported)            | HTML                              |
| **Image uploads**             | Custom upload handler (Supabase Storage) | Built-in but needs custom backend |
| **YouTube embeds**            | Official extension                       | Supported                         |
| **Bundle size**               | ~50KB (tree-shakable)                    | ~300KB+                           |
| **Community**                 | 10K+ GitHub stars, active                | Smaller community                 |
| **Markdown support**          | Built-in shortcuts                       | Limited                           |

**Decision: Use Tiptap** — it's free, lighter, more customizable, and integrates perfectly with React/Next.js. If you already own a Syncfusion license and prefer it, it can work too, but Tiptap is the better technical fit.

### Tiptap Setup

Install:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-youtube @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-code-block-lowlight @tiptap/extension-typography @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight
```

### Editor Features (Toolbar)

```
Bold | Italic | Underline | Strikethrough | Code
──────────────────────────────────────────────
H1 | H2 | H3 | Paragraph | Quote | Code Block
──────────────────────────────────────────────
Bullet List | Ordered List | Task List
──────────────────────────────────────────────
Link | Image Upload | YouTube Embed
──────────────────────────────────────────────
Text Align: Left | Center | Right
──────────────────────────────────────────────
Undo | Redo | Clear Formatting
```

### Image Handling in Blog Posts

When user clicks "Insert Image" in the toolbar:

1. Open a dialog with two tabs:
   - **Upload**: File picker → upload to Supabase Storage `blog/` bucket → insert image URL
   - **URL**: Paste an external image URL directly
2. After insertion, the image node should support:
   - Alt text (required for SEO/accessibility)
   - Caption (optional)
   - Alignment (left, center, right)
   - Size (small, medium, full-width)
3. Image upload flow:
   - Client-side resize to max 1920px width (use canvas API) before upload to save storage
   - Upload to `blog/{post-id}/{timestamp}-{filename}.webp`
   - Convert to WebP format client-side for optimal size
   - Store returned public URL in the editor HTML
4. When a blog post is deleted, also delete its images from Supabase Storage

### Video Strategy

**YouTube Embeds (Primary — Recommended)**

- Use Tiptap's `@tiptap/extension-youtube` extension
- User pastes a YouTube URL → converts to responsive iframe embed
- Lazy-load iframes (use `loading="lazy"` + `srcdoc` pattern for performance)
- Supports YouTube and Vimeo URLs

**Self-hosted video (NOT recommended for now)**

- Video hosting is expensive (storage + bandwidth)
- Supabase Storage free tier is only 1GB — a single 1080p video can be 500MB+
- YouTube/Vimeo give you free CDN, adaptive streaming, and mobile optimization
- **If self-hosted is needed later**: Upload to Supabase Storage, use `<video>` tag with poster image

**Recommendation to user**: Host ALL videos on YouTube (unlisted if private) and embed them. This gives you:

- Free unlimited storage and bandwidth
- Adaptive bitrate streaming (auto quality)
- Mobile optimization
- Closed captions
- Analytics
- No impact on your Supabase storage quota

### Code Block Syntax Highlighting

Use `@tiptap/extension-code-block-lowlight` with:

- Language auto-detection
- Manual language selection dropdown
- Themes: Use a dark theme that matches the portfolio aesthetic
- Install `lowlight` and register common languages (js, ts, python, sql, bash, json, html, css, jsx, tsx)

### Editor Component Architecture

```
/components/blog/
  BlogEditor.tsx          — Main editor component (Tiptap instance + toolbar)
  EditorToolbar.tsx       — Toolbar with formatting buttons
  ImageUploadDialog.tsx   — Dialog for uploading/linking images
  YouTubeEmbedDialog.tsx  — Dialog for pasting YouTube URLs
  BlogPreview.tsx         — Live preview of rendered blog content
  BlogRenderer.tsx        — Renders stored HTML on public blog pages (with sanitization)
```

## Blog Admin Pages

### Blog List (`/admin/blog`)

Table with columns:

- Cover Image (thumbnail)
- Title
- Status (Published / Draft — badge)
- Tags
- Published Date
- Read Time
- Actions (Edit / Delete / Preview / Duplicate)

Features:

- Filter by status (All / Published / Drafts)
- Search by title
- Sort by date (newest first default)
- Bulk actions: Publish / Unpublish / Delete selected

### New/Edit Blog Post (`/admin/blog/new` and `/admin/blog/[id]`)

Layout: Two-column on desktop

**Left column (70%)** — Editor:

- Title input (large, prominent — like Medium)
- Tiptap rich text editor (full height)

**Right column (30%)** — Metadata sidebar:

- **Status**: Draft / Published toggle
- **Published date**: Date picker (default: now when publishing)
- **Slug**: Auto-generated from title, editable
- **Excerpt**: Textarea (auto-generated from first 160 chars of content, editable)
- **Cover image**: Image upload component
- **Tags**: Tag input (type to add, suggestions from existing tags)
- **Read time**: Auto-calculated from word count (display only)
- **SEO section** (collapsible):
  - Meta title (defaults to post title)
  - Meta description (defaults to excerpt)
  - OG image (defaults to cover image)
  - SEO preview (shows how it looks in Google)

**Top bar**:

- Back to blog list
- Save Draft button
- Publish/Update button
- Preview button (opens public URL in new tab)

### Auto-save

- Auto-save draft every 30 seconds while editing
- Show "Saved" / "Saving..." / "Unsaved changes" indicator
- Use `debounce` — don't save on every keystroke
- Store auto-save in the same blog_posts row (don't create separate drafts table)

### Slug Generation

```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80)
}
```

Check for uniqueness against existing slugs. If duplicate, append `-2`, `-3`, etc.

### Read Time Calculation

```typescript
function calculateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "")
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200)) // 200 WPM average
}
```

## Public Blog Pages

### Blog Listing (`/blog`)

- Grid of blog post cards (2 or 3 columns on desktop)
- Each card: Cover image, title, excerpt, date, read time, tags
- Hover animation (subtle lift + shadow)
- Filter by tag (clickable tag pills at top)
- Pagination or infinite scroll (start with pagination — better for SEO)
- Empty state if no posts

### Blog Post Page (`/blog/[slug]`)

- Full-width cover image with parallax effect
- Title (large, bold)
- Meta info: Published date, read time, tags
- Rendered HTML content (use `BlogRenderer` component)
- Table of contents sidebar (auto-generated from H2/H3 headings) — sticky on desktop
- Social share buttons (Twitter, LinkedIn, copy link)
- "Back to blog" link
- Previous/Next post navigation at bottom

### Blog Content Rendering (`BlogRenderer`)

The rendered blog HTML needs:

1. **Sanitization**: Use `DOMPurify` or `sanitize-html` to prevent XSS
2. **Styling**: Apply prose styles (use Tailwind `@apply` or custom CSS for `h1-h6`, `p`, `a`, `img`, `pre`, `code`, `blockquote`, `ul`, `ol`, `table`)
3. **Image optimization**: Wrap `<img>` tags with `next/image` for lazy loading + optimization
4. **Code highlighting**: Apply syntax highlighting to `<pre><code>` blocks using Shiki or rehype-pretty-code at render time
5. **YouTube embeds**: Render lazy-loaded responsive iframes
6. **Link behavior**: External links open in new tab with `rel="noopener noreferrer"`

### RSS Feed

Create `/app/blog/feed.xml/route.ts` that generates an RSS 2.0 feed:

- Include all published posts
- Title, description, link, pubDate, content (excerpt)
- Auto-discover link in `<head>` of blog pages

## Data Fetching Pattern for Blog

```typescript
// Server Component: /app/(public)/blog/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function BlogPage() {
  const supabase = await createServerClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, published_at, read_time_minutes')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return <BlogListing posts={posts ?? []} />
}

// Use Next.js unstable_cache or fetch cache tags for caching:
// { next: { tags: ['blog'] } }
```
