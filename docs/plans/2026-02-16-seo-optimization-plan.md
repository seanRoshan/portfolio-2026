# SEO Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize seanroshan.com for Google search presence — Knowledge Panel with profile photo, proper sitemap indexing, and consolidated domain authority.

**Architecture:** Enhance existing Next.js metadata API and JSON-LD structured data pipeline. Add canonical URL strategy across all pages, optimize profile images as static assets, and enhance sitemap. Manual steps for Vercel domain config, Google Search Console, and Wikidata.

**Tech Stack:** Next.js 16 Metadata API, Schema.org JSON-LD, Vercel domain management, Google Search Console

**Design doc:** `docs/plans/2026-02-16-seo-optimization-design.md`

---

### Task 1: Fix JsonLd Component XSS Safety

The current `JsonLd` component uses `JSON.stringify()` without XSS sanitization. Next.js docs recommend replacing `<` with `\u003c`.

**Files:**

- Modify: `src/components/JsonLd.tsx`

**Step 1: Update JsonLd to sanitize output**

Replace `JSON.stringify(item)` with the sanitized version per the Next.js official recommendation. The `replace(/</g, '\\u003c')` prevents script injection if any data contains a closing script tag.

**Step 2: Commit**

```bash
git add src/components/JsonLd.tsx
git commit -m "fix(seo): sanitize JSON-LD output to prevent XSS"
```

---

### Task 2: Add Canonical URL to Root Metadata

The `buildRootMetadata()` function in `seo.ts` is missing `alternates.canonical`. This tells Google which URL is authoritative.

**Files:**

- Modify: `src/lib/seo.ts`

**Step 1: Add canonical to alternates in buildRootMetadata()**

In the return object of `buildRootMetadata()`, update the `alternates` block to include:

```typescript
alternates: {
  canonical: siteUrl || undefined,
  types: {
    "application/rss+xml": "/blog/feed.xml",
  },
},
```

**Step 2: Verify locally**

Run: `npm run dev`Visit: `http://localhost:3000`Check page source for `<link rel="canonical" ...>` in the `<head>`.

**Step 3: Commit**

```bash
git add src/lib/seo.ts
git commit -m "feat(seo): add canonical URL to root metadata"
```

---

### Task 3: Add Page-Level Canonical URLs

Each public page needs its own canonical URL in `generateMetadata()`.

**Files:**

- Modify: `src/app/(public)/page.tsx` (home)
- Modify: `src/app/(public)/blog/page.tsx` (blog index)
- Modify: `src/app/(public)/blog/[slug]/page.tsx` (blog post)
- Modify: `src/app/(public)/resume/page.tsx` (resume)

**Step 1: Home page — add canonical**

In `src/app/(public)/page.tsx`, update `generateMetadata()` to add:

```typescript
alternates: {
  canonical: config.siteUrl || undefined,
},
```

**Step 2: Blog index — add canonical**

In `src/app/(public)/blog/page.tsx`, add to the returned metadata:

```typescript
alternates: {
  canonical: config ? `${config.siteUrl}/blog` : undefined,
},
```

**Step 3: Blog post — add canonical**

In `src/app/(public)/blog/[slug]/page.tsx`, add `getCachedSiteConfig()` call alongside existing `getBlogPost()`, then add:

```typescript
alternates: {
  canonical: config ? `${config.siteUrl}/blog/${slug}` : undefined,
},
```

**Step 4: Resume page — add canonical**

In `src/app/(public)/resume/page.tsx`, add:

```typescript
alternates: {
  canonical: config ? `${config.siteUrl}/resume` : undefined,
},
```

**Step 5: Verify all canonical URLs locally**

Run: `npm run dev`Check page source on each page for correct canonical link tags.

**Step 6: Commit**

```bash
git add "src/app/(public)/page.tsx" "src/app/(public)/blog/page.tsx" "src/app/(public)/blog/[slug]/page.tsx" "src/app/(public)/resume/page.tsx"
git commit -m "feat(seo): add page-level canonical URLs to all public pages"
```

---

### Task 4: Enhance Person Schema with Entity Signals

The current Person schema in `json-ld.ts` is minimal. Add `@id`, `alternateName`, `jobTitle`, `knowsAbout` for Knowledge Panel recognition.

**Files:**

- Modify: `src/lib/json-ld.ts`

**Step 1: Update personAndWebsiteJsonLd()**

Add to the Person object:

- `"@id": "${config.siteUrl}/#person"` — for cross-page entity linking
- `alternateName: "Shahriyar Valielahiroshan"` — legal name discoverability
- `jobTitle: "Software Engineer"`
- `knowsAbout: ["Software Engineering", "Web Development", "TypeScript", "React", "Next.js"]`

Add to the WebSite object:

- `"@id": "${config.siteUrl}/#website"`

**Step 2: Commit**

```bash
git add src/lib/json-ld.ts
git commit -m "feat(seo): enhance Person schema with @id, alternateName, jobTitle, knowsAbout"
```

---

### Task 5: Add BreadcrumbList Schema

BreadcrumbList helps Google understand site hierarchy and can appear in search results.

**Files:**

- Modify: `src/lib/json-ld.ts`
- Modify: `src/app/(public)/blog/page.tsx`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
- Modify: `src/app/(public)/resume/page.tsx`

**Step 1: Add breadcrumbJsonLd() function to json-ld.ts**

New function that takes a siteUrl and array of `{ name, path }` items and returns a BreadcrumbList schema with "Home" as position 1, then the provided items.

**Step 2: Add breadcrumbs to blog index page**

Import `breadcrumbJsonLd` and pass both `collectionPageJsonLd(config)` and `breadcrumbJsonLd(config.siteUrl, [{ name: "Blog", path: "/blog" }])` as an array to JsonLd.

**Step 3: Add breadcrumbs to blog post page**

Import `breadcrumbJsonLd` and pass both the article JSON-LD and breadcrumbs with path: `[{ name: "Blog", path: "/blog" }, { name: post.title, path: "/blog/${post.slug}" }]`.

**Step 4: Add breadcrumbs to resume page**

Import `breadcrumbJsonLd` and pass both the profilePage JSON-LD and breadcrumbs with `[{ name: "Resume", path: "/resume" }]`.

**Step 5: Commit**

```bash
git add src/lib/json-ld.ts "src/app/(public)/blog/page.tsx" "src/app/(public)/blog/[slug]/page.tsx" "src/app/(public)/resume/page.tsx"
git commit -m "feat(seo): add BreadcrumbList schema to all public pages"
```

---

### Task 6: Enhance Article and ProfilePage Schemas

Update article author to use `@id` reference and enhance ProfilePage with image.

**Files:**

- Modify: `src/lib/json-ld.ts`

**Step 1: Update articleJsonLd() author**

Add `"@id": "${author.siteUrl}/#person"` to the author object, linking it to the Person entity defined on the home page.

**Step 2: Update profilePageJsonLd() mainEntity**

Add `"@id": "${config.siteUrl}/#person"` to the mainEntity Person object. Also ensure image is included.

**Step 3: Commit**

```bash
git add src/lib/json-ld.ts
git commit -m "feat(seo): enhance Article author @id linking and ProfilePage schema"
```

---

### Task 7: Enhance Sitemap with lastModified and Images

The current sitemap is missing `lastModified` on static pages and doesn't include blog post images.

**Files:**

- Modify: `src/app/sitemap.ts`

**Step 1: Update sitemap**

- Add `lastModified: new Date()` to all static page entries
- Add `cover_image_url` to the blog posts query
- Add `images: [post.cover_image_url]` to blog entries that have cover images

**Step 2: Verify sitemap output**

Run: `npm run dev`Visit: `http://localhost:3000/sitemap.xml`Verify: static pages have `<lastmod>`, blog posts with cover images have `<image:image>` entries.

**Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add lastModified to static pages and images to blog sitemap entries"
```

---

### Task 8: Profile Image Optimization

Add optimized profile images as static assets for schema markup and Knowledge Panel.

**Files:**

- Create: `public/images/` directory
- Create: optimized profile images
- Modify: `src/lib/json-ld.ts` (update Person schema image URL)

**Step 1: Ask user for their original photo path**

User provides the file path to their high-resolution profile photo.

**Step 2: Generate optimized images**

Using sips (macOS built-in) or sharp, create:

- `public/images/profile-1000x1333.jpg` — 3:4 aspect ratio for Knowledge Panel (quality 85)
- `public/images/profile-512x512.jpg` — square crop for schema markup (quality 85)

**Step 3: Update Person schema image to use static URL**

In `personAndWebsiteJsonLd()`, set image to `${config.siteUrl}/images/profile-1000x1333.jpg` (the static canonical URL, not the Supabase dynamic URL).

**Step 4: Commit**

```bash
git add public/images/ src/lib/json-ld.ts
git commit -m "feat(seo): add optimized profile images for Knowledge Panel and schema markup"
```

---

### Task 9: Vercel Domain Configuration (Manual - User Steps)

**Step 1:** Go to Vercel Dashboard &gt; portfolio project &gt; Settings &gt; Domains. Ensure `seanroshan.com` is the primary domain.

**Step 2:** For each of `.dev`, `.io`, `.ca`, `.us`, `.live` — set to "Redirect to" `seanroshan.com` (308 permanent redirect).

**Step 3:** Go to Settings &gt; Environment Variables. Set `NEXT_PUBLIC_SITE_URL` = `https://seanroshan.com` for Production scope.

**Step 4:** Trigger a new production deployment.

---

### Task 10: Google Search Console Setup (Manual - User Steps)

**Step 1:** Go to [search.google.com/search-console](https://search.google.com/search-console). Add Domain property: `seanroshan.com`.

**Step 2:** Verify via DNS TXT record at your domain registrar.

**Step 3:** Submit sitemap: `https://seanroshan.com/sitemap.xml`.

**Step 4:** Request indexing for: `/`, `/blog`, `/resume`.

---

### Task 11: External Entity Signals (Manual - User Steps)

**Step 1:** Create Wikidata entry for "Sean Roshan" with properties: instance of: human, occupation: software engineer, official website: https://seanroshan.com, also known as: Shahriyar Valielahiroshan.

**Step 2:** Update all social profiles (LinkedIn, GitHub, Twitter/X) — website field should be `https://seanroshan.com`.

**Step 3:** After deploying, validate all pages with [Google Rich Results Test](https://search.google.com/test/rich-results).

**Step 4:** Once Google indexes the site, claim Knowledge Panel via [posts.google.com/author](https://posts.google.com/author) and suggest profile photo (3:4 ratio, 1000px+ wide, face clearly visible).

---

## Task Dependency Order

```
Task 1 (JsonLd fix) — no dependencies
Task 2 (root canonical) — no dependencies
Task 3 (page canonicals) — no dependencies
Task 4 (Person schema) — no dependencies
Task 5 (BreadcrumbList) — depends on Task 4 (imports from json-ld.ts)
Task 6 (Article/ProfilePage) — depends on Task 4
Task 7 (Sitemap) — no dependencies
Task 8 (Profile images) — depends on Task 4 (updates json-ld.ts)
Task 9 (Vercel config) — manual, no code dependencies
Task 10 (Search Console) — depends on Task 9 (needs domain configured)
Task 11 (Entity signals) — depends on Task 10 (needs site indexed)
```

**Parallelizable:** Tasks 1, 2, 3, 4, 7 can all run independently. **Sequential:** Tasks 5, 6, 8 depend on Task 4 completing first. **Code tasks:** 1-8 (automated) **Manual tasks:** 9-11 (user performs in browser)