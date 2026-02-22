# Resume List Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the resume builder list page with a full-width layout featuring a prominent master resume hero card and a filterable grid of tailored resume cards.

**Architecture:** Replace the current `max-w-5xl` constrained list with a two-section layout: a master resume hero card (full-width, gradient accent, metadata + actions) and a responsive grid of tailored resume cards with search filter. Remove AdminHeader in favor of an inline page header with integrated mobile menu.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Lucide icons

---

### Task 1: Update page.tsx — Remove AdminHeader, Add Mobile Menu

**Files:**
- Modify: `src/app/admin/resume-builder/page.tsx`

**Step 1: Replace page.tsx content**

Replace the entire file with a server component that passes data directly and includes its own mobile menu trigger:

```tsx
import { getResumes } from '@/lib/resume-builder/queries'
import { getTemplates } from '@/lib/resume-builder/queries'
import { ResumeList } from './resume-list'

export default async function ResumeBuilderPage() {
  const [resumes, templates] = await Promise.all([
    getResumes(),
    getTemplates(),
  ])

  return (
    <div className="p-4 md:p-6">
      <ResumeList resumes={resumes} templates={templates} />
    </div>
  )
}
```

Key change: Remove `<AdminHeader title="Resume Builder" />`. The page header will be rendered inside `ResumeList` with an inline mobile menu trigger.

**Step 2: Verify page loads**

Run: `npm run dev` and navigate to `/admin/resume-builder`
Expected: Page loads without the sticky AdminHeader bar. Content area has more vertical space.

**Step 3: Commit**

```bash
git add src/app/admin/resume-builder/page.tsx
git commit -m "refactor: remove AdminHeader from resume builder page"
```

---

### Task 2: Rewrite ResumeList — Template Color Map + Helper Constants

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx`

**Step 1: Add template color map and helper at the top of the file**

Add these constants after the existing `experienceLevels` array (around line 58):

```tsx
/** Accent colors per template name for card left-border */
const TEMPLATE_COLORS: Record<string, string> = {
  Pragmatic: 'border-l-blue-500',
  Mono: 'border-l-zinc-400',
  Smarkdown: 'border-l-emerald-500',
  CareerCup: 'border-l-orange-500',
  Parker: 'border-l-violet-500',
  Experienced: 'border-l-teal-500',
}

function getTemplateColor(name: string): string {
  return TEMPLATE_COLORS[name] ?? 'border-l-zinc-500'
}
```

**Step 2: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat: add template color map for resume cards"
```

---

### Task 3: Rewrite ResumeList — Inline Page Header with Mobile Menu

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx`

**Step 1: Add mobile menu imports**

Add these to the import block:

```tsx
import { Menu, Search } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { AdminSidebar } from '../admin-sidebar'
```

**Step 2: Replace the outer wrapper and header section**

Replace the existing return block's outer `<div className="mx-auto max-w-5xl">` and the header `<div className="mb-6 flex items-center justify-between">` with:

```tsx
return (
  <div className="mx-auto w-full max-w-[1600px]">
    {/* Inline page header with mobile menu */}
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground text-sm">
            Manage your master resume and tailored versions.
          </p>
        </div>
      </div>
    </div>

    {/* ... rest of content */}
  </div>
)
```

Key changes:
- `max-w-5xl` → `max-w-[1600px]` for full-width usage
- Mobile hamburger menu inline (Sheet component)
- Title is now `h1` not `h2`, and describes the whole page

**Step 3: Verify mobile menu works**

Run dev server, resize to mobile, tap hamburger menu.
Expected: Sidebar slides in from left.

**Step 4: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat: inline page header with mobile menu for resume list"
```

---

### Task 4: Master Resume Hero Card

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx`

**Step 1: Add master resume hero section**

After the page header, before the tailored resumes grid, add the master resume hero. Separate the master resume from tailored resumes in the component:

```tsx
// Inside the component, derive master and tailored lists:
const masterResume = resumes.find((r) => r.is_master) ?? null
const tailoredResumes = resumes.filter((r) => !r.is_master)
```

Then render the hero card:

```tsx
{/* Master Resume Hero */}
{masterResume ? (
  <Card className="mb-8 overflow-hidden border-l-4 border-l-primary bg-gradient-to-r from-primary/5 via-transparent to-transparent">
    <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
      {/* Left: PDF thumbnail placeholder */}
      <div className="bg-muted/50 flex h-[200px] w-[155px] shrink-0 items-center justify-center rounded-md border">
        <FileText className="text-muted-foreground/40 h-12 w-12" />
      </div>

      {/* Right: Metadata + Actions */}
      <div className="flex-1 space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Master Resume
            </Badge>
          </div>
          <h2 className="text-xl font-semibold">{masterResume.title}</h2>
          {masterResume.target_role && (
            <p className="text-muted-foreground text-sm">{masterResume.target_role}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
            <FileText className="h-3.5 w-3.5" />
            {getTemplateName(masterResume.template_id)}
          </span>
          {getLevelLabel(masterResume.experience_level) && (
            <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium">
              {getLevelLabel(masterResume.experience_level)}
            </span>
          )}
          <span className="text-muted-foreground/60 inline-flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Updated {formatDate(masterResume.updated_at)}
          </span>
        </div>

        {masterResume.short_id && (
          <p className="text-muted-foreground text-xs">
            Public URL: <code className="bg-muted rounded px-1.5 py-0.5">/r/{masterResume.short_id}</code>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/admin/resume-builder/${masterResume.id}/edit`}>
              Edit Resume
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  setCloneTitle(`${masterResume.title} (Copy)`)
                  setShowClone(masterResume.id)
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </Card>
) : (
  <Card className="mb-8 flex flex-col items-center justify-center border-dashed py-12">
    <Crown className="text-muted-foreground mb-3 h-10 w-10" />
    <h3 className="mb-1 text-lg font-semibold">No Master Resume</h3>
    <p className="text-muted-foreground mb-4 max-w-md text-center text-sm">
      Create your master resume — it powers your public resume page and PDF downloads.
    </p>
    <Button onClick={() => setShowCreate(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Create Master Resume
    </Button>
  </Card>
)}
```

**Step 2: Verify hero card renders**

Run dev server, navigate to `/admin/resume-builder`.
Expected: Master resume shows as a full-width hero card with gradient accent, metadata, and action buttons. If no master, the invitation card appears.

**Step 3: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat: master resume hero card with gradient accent and actions"
```

---

### Task 5: Tailored Resumes Section — Header with Search + Grid

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx`

**Step 1: Add search state**

Add to the component state declarations:

```tsx
const [searchQuery, setSearchQuery] = useState('')
```

**Step 2: Add filtered resumes logic**

```tsx
const filteredTailored = tailoredResumes.filter((r) => {
  if (!searchQuery.trim()) return true
  const q = searchQuery.toLowerCase()
  return (
    r.title.toLowerCase().includes(q) ||
    (r.target_role?.toLowerCase().includes(q) ?? false)
  )
})
```

**Step 3: Replace the existing grid with the tailored resumes section**

Remove the existing `resumes.length === 0` empty state and the `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` block. Replace with:

```tsx
{/* Tailored Resumes Section */}
<div>
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold">Tailored Resumes</h2>
      {tailoredResumes.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {tailoredResumes.length}
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-2">
      {tailoredResumes.length > 0 && (
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by title or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[240px] pl-8"
          />
        </div>
      )}
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Resume
      </Button>
    </div>
  </div>

  {tailoredResumes.length === 0 ? (
    <Card className="flex flex-col items-center justify-center border-dashed py-12">
      <Target className="text-muted-foreground mb-3 h-10 w-10" />
      <h3 className="mb-1 text-lg font-semibold">No tailored resumes yet</h3>
      <p className="text-muted-foreground mb-4 max-w-md text-center text-sm">
        Tailor a resume for a specific job to increase your match rate.
      </p>
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Tailored Resume
      </Button>
    </Card>
  ) : filteredTailored.length === 0 ? (
    <div className="text-muted-foreground py-12 text-center text-sm">
      No resumes match &ldquo;{searchQuery}&rdquo;
    </div>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredTailored.map((resume) => {
        const templateName = getTemplateName(resume.template_id)
        const levelLabel = getLevelLabel(resume.experience_level)
        const colorClass = getTemplateColor(templateName)
        return (
          <Card
            key={resume.id}
            className={cn(
              'group relative overflow-hidden border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5',
              colorClass
            )}
          >
            <Link
              href={`/admin/resume-builder/${resume.id}/edit`}
              className="block p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold leading-tight" title={resume.title}>
                    {resume.title}
                  </h3>
                  {resume.target_role && (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {resume.target_role}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Resume actions"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setCloneTitle(`${resume.title} (Copy)`)
                        setShowClone(resume.id)
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowDelete(resume.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium">
                  <FileText className="h-3 w-3" />
                  {templateName}
                </span>
                {levelLabel && (
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium">
                    {levelLabel}
                  </span>
                )}
              </div>

              <div className="text-muted-foreground/60 flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3 w-3" />
                Updated {formatDate(resume.updated_at)}
              </div>
            </Link>
          </Card>
        )
      })}
    </div>
  )}
</div>
```

**Step 4: Import `cn` if not already imported**

Make sure `cn` is imported from `@/lib/utils`:

```tsx
import { cn } from '@/lib/utils'
```

**Step 5: Verify search and grid**

Run dev server, verify:
- Grid shows 4 columns on wide screens
- Search filters cards in real-time
- Empty state shows when no tailored resumes exist
- Template color accent appears on card left border

**Step 6: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat: tailored resumes grid with search filter and template colors"
```

---

### Task 6: Final Polish — Verify Full Layout

**Files:** None (verification only)

**Step 1: Visual verification**

Run `npm run dev` and check:
1. Page fills available width (no narrow column)
2. Master resume hero card has gradient accent, crown badge, metadata, edit button
3. Tailored resumes grid is responsive (1 → 2 → 3 → 4 columns)
4. Search filters work
5. Card template color accents match the design
6. Mobile hamburger menu opens sidebar
7. Create/Clone/Delete dialogs still work
8. Empty states render correctly

**Step 2: Final commit (if any tweaks needed)**

```bash
git add -A
git commit -m "polish: resume list page redesign final adjustments"
```
