# SEO Optimization Design - Portfolio

**Date:** 2026-02-16 **Status:** Approved **Goal:** Optimize seanroshan.com for Google search presence including Knowledge Panel, profile photo, and sitemap visibility.

## Decisions

- **Canonical domain:** `https://seanroshan.com` (no www)
- **All other domains** (`.dev`, `.io`, `.ca`, `.us`, `.live`) redirect via Vercel 308s
- **Display name:** Sean Roshan (alternate: Shahriyar Valielahiroshan)
- **Approach:** Full optimization - code + domain redirects + Google Search Console + external signals

## 1. Domain Consolidation

### Vercel Dashboard (Manual)

- Set `seanroshan.com` as primary domain for portfolio project
- Configure 5 other domains as redirects to `seanroshan.com`
- Set `NEXT_PUBLIC_SITE_URL=https://seanroshan.com` in production environment variables

### Code

- Add `alternates.canonical` to `buildRootMetadata()` in `src/lib/seo.ts`
- Add page-level canonical URLs in each `generateMetadata()` (home, blog, resume)

## 2. Profile Image Optimization

- User provides high-res original photo
- Generate optimized sizes:
  - `public/images/profile-1000x1333.jpg` (3:4, Knowledge Panel)
  - `public/images/profile-512x512.jpg` (schema/OG)
- Reference static URL `https://seanroshan.com/images/profile-1000x1333.jpg` in Person schema
- Supabase avatar URL remains for dynamic site rendering

## 3. Enhanced Structured Data

### `src/lib/json-ld.ts` changes

**Person schema (home page):**

- Add `@id: "https://seanroshan.com/#person"` for cross-page entity linking
- Add `alternateName: "Shahriyar Valielahiroshan"`
- Add `jobTitle` and `knowsAbout` fields
- Point `image` to static canonical URL

**BreadcrumbList schema (all pages):**

- New `breadcrumbJsonLd()` function
- Home &gt; Blog &gt; Post Title hierarchy

**ProfilePage schema (resume):**

- Add `dateCreated`, `dateModified`, `image`
- Use `@id` reference for mainEntity Person

**Article schema (blog posts):**

- Author uses `@id` reference to Person entity

## 4. Sitemap Enhancement

### `src/app/sitemap.ts` changes

- Add `lastModified` to static pages (home, blog index, resume)
- Add image entries for blog posts with cover images

## 5. Google Search Console (Manual)

1. Add Domain property for `seanroshan.com`
2. Verify via DNS TXT record
3. Submit `https://seanroshan.com/sitemap.xml`
4. Request indexing for key pages

## 6. External Entity Signals (Manual)

1. Create Wikidata entry with name, alternate name, occupation, website, socials
2. Align all social profiles (LinkedIn, GitHub, Twitter) to link to `https://seanroshan.com`
3. Claim Knowledge Panel once it appears via posts.google.com/author
4. Validate schema with Google Rich Results Test

## Files Modified

| File | Change |
| --- | --- |
| `src/lib/seo.ts` | Add canonical URL to alternates |
| `src/lib/json-ld.ts` | Enhanced Person, BreadcrumbList, @id linking |
| `src/app/sitemap.ts` | lastModified + image entries |
| `src/app/(public)/page.tsx` | Page-level canonical, enhanced JSON-LD |
| `src/app/(public)/blog/page.tsx` | Canonical URL |
| `src/app/(public)/blog/[slug]/page.tsx` | Canonical URL, breadcrumb JSON-LD |
| `src/app/(public)/resume/page.tsx` | Canonical URL, enhanced ProfilePage JSON-LD |
| `public/images/` | Optimized profile images (new) |
| `vercel.json` | No code changes needed (domain config via dashboard) |
