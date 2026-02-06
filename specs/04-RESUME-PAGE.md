# 04 — Online Resume Page

## Design Philosophy (UX + Career Advisor Perspective)

The online resume is NOT a copy-paste of a traditional PDF resume. It's a web-native experience that leverages the medium while maintaining the substance hiring managers expect.

### Career Advisor Guidelines

1. **Lead with impact, not responsibilities** — Every bullet point should quantify results
2. **Tailor the narrative** — The summary should clearly state who you are, what you do, and what value you bring
3. **Keep it scannable** — Hiring managers spend 6-7 seconds on first scan
4. **No objective statements** — Use a professional summary instead
5. **Recent is relevant** — Most detail on last 2-3 roles, less on older ones
6. **ATS-friendly PDF** — The downloadable version must be clean, parseable text (no images for text, no fancy layouts that break ATS)
7. **Consistency** — Work history should match LinkedIn exactly

## Public Resume Page (`/resume`)

### Layout — Clean, Professional, Web-Native

```
┌──────────────────────────────────────────────┐
│  [Download PDF]                    [Print]    │
├──────────────────────────────────────────────┤
│                                              │
│  SEAN [LAST NAME]                            │
│  Senior Full-Stack Software Developer        │
│                                              │
│  📍 Location  ✉️ email  🔗 linkedin  💻 github │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  PROFESSIONAL SUMMARY                        │
│  2-3 sentence overview of experience,        │
│  specialization, and value proposition       │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  TECHNICAL SKILLS                            │
│  Grouped by category, no percentages,        │
│  simple list format:                         │
│                                              │
│  Frontend: React, Next.js, TypeScript, ...   │
│  Backend: Node.js, Java, Python, ...         │
│  Cloud & DevOps: AWS, Docker, Terraform, ... │
│  Databases: PostgreSQL, SQL Server, ...      │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  PROFESSIONAL EXPERIENCE                     │
│                                              │
│  Company Name                    Start-End   │
│  Role Title | Location                       │
│  • Achievement bullet with metrics           │
│  • Achievement bullet with metrics           │
│  • Achievement bullet with metrics           │
│                                              │
│  (Repeat for each role)                      │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  EDUCATION                                   │
│  Degree — School — Year                      │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  CERTIFICATIONS (if any)                     │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ADDITIONAL (open source, speaking, etc.)    │
│                                              │
└──────────────────────────────────────────────┘
```

### Web Resume Enhancements (Not in PDF)

The web version can include:
- Subtle scroll-triggered animations (fade in sections as you scroll)
- Clickable links (company URLs, project URLs)
- Hover tooltips on skills showing brief context
- Smooth anchor navigation between sections
- Print-optimized CSS (`@media print`)

### Styling

- Clean, minimal — think Google Docs resume but with better typography
- Single column layout (ATS-friendly structure mirrors the PDF)
- Use the portfolio's font system but keep it conservative for professional context
- High contrast text (black on white)
- Clear section dividers
- Generous whitespace

## PDF Download

### Generation Strategy: Server-Side with Puppeteer

**Why Puppeteer over other options?**

| Option | Pros | Cons |
|--------|------|------|
| **Puppeteer/Playwright** | Pixel-perfect, matches web view, CSS support | Needs serverless function, heavier |
| **react-pdf** | Pure React, lightweight | Different rendering engine, layout differences |
| **docx-js → PDF** | Native PDF | Can't match web styles easily |
| **Pre-generated upload** | Simplest | Admin must regenerate manually every time |

**Decision: Hybrid approach**
1. **Primary**: Use `@react-pdf/renderer` to generate PDF server-side — it's lightweight, runs in serverless, and gives you precise control over the PDF layout
2. **The PDF layout is a SEPARATE component** from the web view — optimized for ATS parsing
3. **Store generated PDF in Supabase Storage** after admin saves resume content
4. **Serve from storage** for downloads (fast, cached, no runtime generation)

### PDF Design (ATS-Optimized)

The PDF version must be:
- **Single column** (ATS can't parse multi-column reliably)
- **No images/icons** for text content (ATS can't read images)
- **Standard fonts** (system fonts that ATS can parse)
- **No headers/footers** (ATS sometimes skips them)
- **No tables for layout** (use plain text with spacing)
- **Links as plain text** (include full URLs)
- **Standard section headers**: "Professional Experience", "Education", "Technical Skills"
- **Consistent date format**: "Jan 2020 – Present"
- **US Letter size** (8.5" × 11"), 0.5-0.75" margins
- **10-11pt body text, 12-14pt section headers**

### PDF Generation API Route

```
GET /api/resume/download
→ Fetches resume data from Supabase
→ Generates PDF using @react-pdf/renderer
→ Returns PDF as downloadable file
→ Cache the PDF in Supabase Storage for subsequent requests
→ Invalidate cached PDF when admin updates resume
```

Alternatively, regenerate and upload PDF to Supabase Storage every time admin saves resume content (simpler, faster downloads).

### Implementation

```typescript
// /app/api/resume/download/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  
  // 1. Check if cached PDF exists and is current
  const { data: resume } = await supabase
    .from('resume')
    .select('pdf_url, updated_at')
    .single()
  
  if (resume?.pdf_url) {
    // Redirect to cached PDF in Supabase Storage
    return Response.redirect(resume.pdf_url)
  }
  
  // 2. Generate fresh PDF (fallback)
  // ... generate with @react-pdf/renderer
  // ... upload to Supabase Storage
  // ... update resume.pdf_url
  // ... return PDF
}
```

## Admin Resume Editor (`/admin/resume`)

### Form Layout

Two-column layout:
- **Left (60%)**: Edit form
- **Right (40%)**: Live preview (web version rendering in real-time)

### Form Sections

**Personal Info**:
- Full name
- Professional title
- Email, Phone, Location
- Website URL, LinkedIn URL, GitHub URL

**Professional Summary**:
- Textarea (3-5 sentences, ~300 chars max recommended)
- Character counter with guideline

**Technical Skills**:
- Pulls from the Skills table (same data as portfolio skills section)
- Toggle which skills appear on resume
- Override category groupings for resume context
- Reorder within categories

**Work Experience**:
- Pulls from the Experience table (same data as portfolio experience section)
- Toggle which entries appear on resume
- For each entry: editable list of achievement bullets
- Guideline hints: "Start with action verb. Include metrics where possible."
- Examples shown as placeholders:
  - "Reduced API response time by 40% through query optimization and caching"
  - "Led migration of 500K+ user records from MongoDB to PostgreSQL"

**Education**:
- Dynamic list of entries
- Each: School, Degree, Field of Study, Year, Details (optional)

**Certifications**:
- Dynamic list
- Each: Name, Issuing Organization, Year

**Additional Sections**:
- Dynamic — admin can add custom sections
- Each section: Title + list of items
- Examples: Open Source Contributions, Speaking Engagements, Publications, Awards

### Save Action

When admin saves:
1. Update `resume` table in Supabase
2. Generate new PDF using `@react-pdf/renderer`
3. Upload PDF to Supabase Storage (`resume/resume-{timestamp}.pdf`)
4. Update `resume.pdf_url` with new storage URL
5. Delete old PDF from storage
6. Revalidate `/resume` page cache
7. Show toast: "Resume updated and PDF regenerated"

## Data Source Sharing

The resume page shares data with the portfolio:
- **Skills** → from `skills` table (filtered by `published = true`)
- **Experience** → from `experience` table (filtered by `published = true`)
- **Personal info** → from `resume` table (unique to resume)
- **Education, Certifications** → from `resume` table JSONB fields

This means updating a skill or experience in the portfolio admin also updates the resume (unless toggled off for resume specifically). To support this, add a `show_on_resume` boolean column to the `skills` and `experience` tables:

```sql
ALTER TABLE skills ADD COLUMN show_on_resume BOOLEAN DEFAULT true;
ALTER TABLE experience ADD COLUMN show_on_resume BOOLEAN DEFAULT true;
```
