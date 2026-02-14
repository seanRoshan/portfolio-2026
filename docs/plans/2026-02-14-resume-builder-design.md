# Resume Builder Extension - Design Document

> Date: 2026-02-14
> Status: Approved
> Stack: Next.js 16 + Supabase + Puppeteer + Anthropic Claude

---

## 1. Architecture

### Module Structure
```
src/app/admin/resume-builder/        ← Admin routes (editor, list, settings)
src/app/r/[shortId]/                 ← Public shareable resume URLs
src/app/api/resume-builder/          ← API routes (PDF gen, AI endpoints)
src/components/resume-builder/       ← UI components
src/lib/resume-builder/              ← Business logic
  ├── templates/                     ← 6 HTML/CSS templates
  ├── validation/                    ← Content rules engine
  ├── ai/                            ← Claude AI integration
  └── pdf/                           ← Puppeteer PDF pipeline
supabase/migrations/                 ← New tables
```

### Data Flow
```
User edits (client) → Server Action → Supabase DB
                                    ↓
                              Revalidate cache
                                    ↓
                         Live preview updates (client)

PDF Export:
Resume data → Template HTML/CSS → Puppeteer → PDF → Supabase Storage → Download URL
```

## 2. Database Schema

### New Tables

**resumes** - Core resume records
- id, user_id, title, template_id, experience_level, target_role
- is_master, parent_resume_id, created_at, updated_at

**resume_contact_info** - Per-resume contact details
- id, resume_id, full_name, email, phone, city, country
- linkedin_url, github_url, portfolio_url, blog_url

**resume_summaries** - Per-resume professional summary
- id, resume_id, text, is_visible

**resume_work_experiences** - Work history entries
- id, resume_id, job_title, company, location
- start_date, end_date, is_promotion, parent_experience_id, sort_order

**resume_achievements** - Bullet points
- id, parent_id, parent_type (work|project), text, has_metric, sort_order

**resume_education** - Education entries
- id, resume_id, degree, institution, field_of_study
- graduation_date, gpa, relevant_coursework, honors, sort_order

**resume_skill_categories** - Skill groups
- id, resume_id, name, skills (text[]), sort_order

**resume_projects** - Project entries
- id, resume_id, name, project_url, source_url, description, sort_order

**resume_certifications** - Certification entries
- id, resume_id, name, issuer, date, sort_order

**resume_extracurriculars** - Extra activities
- id, resume_id, type, title, description, url, sort_order

**resume_settings** - Per-resume display settings
- id, resume_id, template_id, accent_color, font_family
- font_size_preset, date_format, section_order, hidden_sections, page_limit

**resume_templates** - Template definitions (seeded)
- id, name, description, category, layout, target_experience_levels
- max_pages, preview_image_url, tokens (JSONB)

**job_applications** - Application tracker
- id, user_id, company, position, url, status, resume_id
- applied_date, response_date, notes, salary_range, location

**job_descriptions** - Saved JDs
- id, user_id, title, company, description, keywords, created_at

**career_coach_sessions** - AI coaching
- id, user_id, topic, messages (JSONB), created_at, updated_at

## 3. Templates (All 6)

| # | Template | Layout | Best For |
|---|----------|--------|----------|
| 1 | Pragmatic | Single-column, classic | Universal safe choice |
| 2 | Mono | Single-column, monospace | Engineers signaling technical identity |
| 3 | Smarkdown | Single-column, markdown-feel | Technical/documentation roles |
| 4 | CareerCup | Single-column, dense | Big Tech (FAANG) applications |
| 5 | Parker | Two-column, dark sidebar | Design-adjacent roles, startups |
| 6 | Experienced | Two-column, professional | Senior professionals |

Each template is implemented as an HTML/CSS component that:
- Takes resume data as props
- Renders print-optimized HTML
- Supports @media print styles
- Is fed to Puppeteer for PDF generation

## 4. AI Integration (Anthropic Claude)

Service layer at `src/lib/resume-builder/ai/`:
- `rewriteBullet()` - XYZ formula bullet rewriter
- `detectCliches()` - Cliche/buzzword detector
- `generateSummary()` - Professional summary generator
- `matchJobDescription()` - JD keyword matcher + gap analysis
- `scoreResume()` - Multi-dimension resume grader
- `translateJargon()` - Internal jargon translator
- `coachInterview()` - Career coach conversational AI
- `generateCoverLetter()` - Cover letter generator

All behind a feature flag - works without API key (features disabled gracefully).

## 5. Validation Rules Engine

Real-time validation at `src/lib/resume-builder/validation/`:
- Critical (block export): empty sections, missing contact info, broken URLs
- Warnings: missing metrics, passive voice, buzzwords, over page limit
- Style: font size minimum, consistent formatting, link styling

## 6. Implementation Phases

### Phase 1: Foundation
1. Database migration
2. Resume CRUD + list page
3. Editor layout (split pane)
4. Contact info section
5. Work experience + achievements
6. Education, skills, projects, certs, extracurriculars
7. Pragmatic template (HTML/CSS)
8. Live preview
9. Puppeteer PDF generation
10. Content validation engine

### Phase 2: All Templates
11. Mono template
12. Smarkdown template
13. CareerCup template
14. Parker template (two-column)
15. Experienced template (two-column)
16. Template switcher + preview

### Phase 3: AI Features
17. AI service layer (Claude)
18. Bullet point rewriter
19. Cliche detector
20. Summary generator
21. Resume scorer
22. JD matcher

### Phase 4: Multi-Resume & Management
23. Master/tailored resume system
24. Clone from master
25. Section drag-and-drop
26. Experience level profiles
27. Resume settings panel

### Phase 5: Extended Features
28. Application tracker
29. JD analyzer
30. Career coach assistant
31. Cover letter builder
32. Web resume (shareable URL)

### Phase 6: Testing & Polish
33. Playwright E2E tests
34. PDF rendering verification
35. Responsive design polish
36. Accessibility audit

## 7. Key Technical Decisions

- **Puppeteer** for PDF: Install as dev dependency, use in API route
- **No external state management**: Server Actions + React state
- **Template tokens**: CSS custom properties for easy customization
- **AI graceful degradation**: Features hidden when no API key
- **Feature branches**: One branch per feature, merge to main
- **Local testing only**: No deployments during development
