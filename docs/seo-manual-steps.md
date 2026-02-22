# SEO Manual Setup Guide

**Date:** 2026-02-16
**Status:** Pending
**Related:** `docs/plans/2026-02-16-seo-optimization-design.md`

All code changes have been implemented and committed. This guide covers the remaining manual steps to complete SEO optimization for `seanroshan.com`.

---

## 1. Vercel Domain Configuration

### Why Redirect?

You own 6 domains all pointing to the same Vercel deployment. Without redirects, Google sees 6 copies of every page (duplicate content penalty) and splits your link equity across all of them. Redirecting consolidates all SEO authority to one domain.

| Domain | Action |
|--------|--------|
| `seanroshan.com` | **Primary** — keep as-is |
| `seanroshan.dev` | Redirect to `seanroshan.com` |
| `seanroshan.io` | Redirect to `seanroshan.com` |
| `seanroshan.ca` | Redirect to `seanroshan.com` |
| `seanroshan.us` | Redirect to `seanroshan.com` |
| `seanroshan.live` | Redirect to `seanroshan.com` |

### Steps

1. Go to [Vercel Dashboard](https://vercel.com) > **portfolio** project > **Settings** > **Domains**

2. Ensure `seanroshan.com` is listed as the **primary domain**
   - If not, click the three-dot menu next to it and select "Set as Primary"

3. For each secondary domain (`.dev`, `.io`, `.ca`, `.us`, `.live`):
   - Click **Edit** next to the domain
   - Change from "Assigned" to **"Redirect to..."**
   - Select `seanroshan.com` as the redirect target
   - Redirect type: **308 (Permanent)**
   - Enable **"Redirect with path"** so `/blog/my-post` redirects to `seanroshan.com/blog/my-post`

4. Go to **Settings** > **Environment Variables**
   - Variable: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://seanroshan.com`
   - Scope: **Production**
   - This is critical — without it, your sitemap, canonical URLs, and robots.txt all point to `localhost:3000`

5. **Trigger a new production deployment** (Settings > Deployments > Redeploy, or push a new commit)

### Verification

After deployment, verify:
- [ ] `curl -I https://seanroshan.dev` returns `308` redirect to `seanroshan.com`
- [ ] `curl -I https://seanroshan.io` returns `308` redirect to `seanroshan.com`
- [ ] Visit `https://seanroshan.com/sitemap.xml` — all URLs should start with `https://seanroshan.com`
- [ ] View page source on `https://seanroshan.com` — check for `<link rel="canonical" href="https://seanroshan.com" />`

---

## 2. Google Search Console Setup

### Step 1: Add Domain Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"** (dropdown at top-left)
3. Select **"Domain"** (not "URL prefix")
4. Enter: `seanroshan.com` (no protocol, no www)

### Step 2: DNS Verification

Google will provide a TXT verification record. Add it at your domain registrar:

| Field | Value |
|-------|-------|
| **Type** | TXT |
| **Host/Name** | `@` (or blank) |
| **Value** | The `google-site-verification=...` string Google provides |
| **TTL** | 3600 (or Auto) |

- DNS propagation can take 5 minutes to 72 hours
- Click **"Verify"** in Google Search Console after adding the record
- If verification fails, wait and retry — DNS can take time

### Step 3: Submit Sitemap

1. In Search Console, go to **Indexing** > **Sitemaps** (left sidebar)
2. In the "Add a new sitemap" field, enter: `https://seanroshan.com/sitemap.xml`
3. Click **Submit**
4. Status should change to "Success" (may take a few minutes)

### Step 4: Request Indexing

Use the **URL Inspection** tool (top search bar in Search Console):

1. Paste `https://seanroshan.com/` > Click **"Request Indexing"**
2. Paste `https://seanroshan.com/blog` > Click **"Request Indexing"**
3. Paste `https://seanroshan.com/resume` > Click **"Request Indexing"**

Google typically crawls within 1-7 days after requesting indexing.

### Verification

- [ ] Domain property shows as "Verified" in Search Console
- [ ] Sitemap status shows "Success" with correct URL count
- [ ] URL Inspection shows pages as "Indexable"

---

## 3. Wikidata Entry

Wikidata feeds directly into Google's Knowledge Graph. This is the single most important external signal for Knowledge Panel creation.

### Step 1: Create Account

1. Go to [wikidata.org](https://www.wikidata.org)
2. Create an account (or log in if you have one)

### Step 2: Create New Item

1. Click **"Create a new item"** (left sidebar)
2. Fill in:
   - **Label (en):** Sean Roshan
   - **Description (en):** software engineer
   - **Also known as:** Shahriyar Valielahiroshan

### Step 3: Add Properties

After creating the item, add these statements (click **"+ add statement"**):

| Property | Property ID | Value |
|----------|-------------|-------|
| instance of | P31 | human (Q5) |
| occupation | P106 | software engineer (Q80855) |
| official website | P856 | `https://seanroshan.com` |
| GitHub username | P2037 | `seanRoshan` |
| Twitter/X username | P2002 | *(your X handle)* |
| LinkedIn personal profile ID | P6634 | *(your LinkedIn slug, e.g. "seanroshan")* |

**Tip:** When adding values, start typing and Wikidata will autocomplete the correct entity (e.g., type "human" for P31 and select "Q5: human").

### Step 4: Note Your Wikidata QID

After creation, your item will have a QID (e.g., `Q123456789`). Save this — you can later add it to your `sameAs` array in the Person schema for even stronger signals.

---

## 4. Social Profile Alignment

Update the **website field** on all your social profiles to point to `https://seanroshan.com`:

- [ ] **LinkedIn** — Edit Profile > Contact Info > Website: `https://seanroshan.com`
- [ ] **GitHub** — Settings > Profile > Blog: `https://seanroshan.com`
- [ ] **Twitter/X** — Edit Profile > Website: `https://seanroshan.com`
- [ ] Any other platforms (Instagram, YouTube, Stack Overflow, etc.)

**Why this matters:** Google cross-references the URLs in your `sameAs` schema with the links on your social profiles. Bidirectional linking (site points to profile, profile points to site) strengthens entity signals.

---

## 5. Validate Structured Data

After deploying, test every public page with Google's validation tools:

### Rich Results Test

Go to [Google Rich Results Test](https://search.google.com/test/rich-results) and test:

- [ ] `https://seanroshan.com/` — should show Person + WebSite schemas
- [ ] `https://seanroshan.com/blog` — should show CollectionPage + BreadcrumbList
- [ ] `https://seanroshan.com/blog/[any-post]` — should show Article + BreadcrumbList
- [ ] `https://seanroshan.com/resume` — should show ProfilePage + BreadcrumbList

### Schema Markup Validator

Go to [Schema Markup Validator](https://validator.schema.org/) for detailed validation of each schema type.

### What to Look For

- No errors (warnings are usually OK)
- Person schema shows: name, alternateName, jobTitle, image, sameAs, knowsAbout
- Article author has `@id` reference
- BreadcrumbList shows correct hierarchy
- All URLs use `https://seanroshan.com` (not localhost)

---

## 6. Claim Knowledge Panel

This step happens **after** Google has indexed your site and created a Knowledge Panel (typically 3-6 weeks after completing all above steps).

### Step 1: Check if Panel Exists

Search `"Sean Roshan"` on Google. If a Knowledge Panel appears on the right side of results, proceed.

### Step 2: Claim the Panel

1. At the bottom of the Knowledge Panel, click **"Claim this Knowledge Panel"**
2. Verify your identity through one of:
   - Google Search Console (recommended — you already set this up)
   - Linked social accounts (YouTube, Twitter)
3. Follow the verification steps

### Step 3: Suggest Featured Image

1. Go to [posts.google.com/author](https://posts.google.com/author)
2. Use the **"Suggest featured image"** option
3. Submit your profile photo (the 3:4 ratio image at `seanroshan.com/images/profile-1000x1333.jpg`)
4. Requirements: face clearly visible, 1000px+ wide, 3:4 aspect ratio

### Step 4: Review Panel Information

Once claimed, you can suggest edits to:
- Featured image
- Description
- Social profile links

---

## Timeline

| Milestone | Expected Timeline |
|-----------|------------------|
| Vercel domain redirects active | Immediate |
| Google crawls and indexes site | 1-7 days after Search Console setup |
| Structured data appears in Rich Results | 2-4 weeks |
| Knowledge Panel appears | 3-6 weeks (with strong Wikidata + social signals) |
| Knowledge Panel claimed and customized | After panel appears |

---

## Checklist Summary

### Immediate (do now)
- [ ] Configure Vercel domain redirects
- [ ] Set `NEXT_PUBLIC_SITE_URL` environment variable
- [ ] Redeploy to production
- [ ] Set up Google Search Console
- [ ] Submit sitemap
- [ ] Request indexing for key pages

### This Week
- [ ] Create Wikidata entry
- [ ] Update all social profile website URLs
- [ ] Validate structured data with Rich Results Test

### Ongoing (check back in 3-6 weeks)
- [ ] Monitor Search Console for indexing status
- [ ] Check for Knowledge Panel appearance
- [ ] Claim Knowledge Panel when it appears
- [ ] Suggest profile photo as featured image
