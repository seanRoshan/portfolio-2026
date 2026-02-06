# 02 — Admin Dashboard

## Authentication Flow

### Login Page (`/login`)

- Clean, minimal login form (email + password only)
- Use Supabase Auth `signInWithPassword()`
- NO public sign-up. The admin user is created manually in Supabase Dashboard (Auth > Users > Add User)
- After successful login → redirect to `/admin`
- Show toast notification on error
- Support "forgot password" flow via Supabase `resetPasswordForEmail()`

### Security Rules

- Only ONE admin user (you). Created manually in Supabase Dashboard.
- Disable Supabase email confirmations for this user (Dashboard > Auth > Providers > Email > toggle off "Confirm email")
- All `/admin/*` routes protected by middleware — redirect to `/login` if no session
- All admin Server Actions verify `supabase.auth.getUser()` before mutating data
- Use `httpOnly` cookies for session management (handled by `@supabase/ssr`)
- Session expires after 1 hour of inactivity (configurable in Supabase Dashboard)

### Logout

- Button in admin sidebar/header
- Calls `supabase.auth.signOut()`
- Redirects to `/login`
- Clears all cookies

## Admin Dashboard Layout

### Sidebar Navigation

```
📊 Dashboard (overview stats)
──────────────
📝 Content
  ├── Hero Section
  ├── About
  ├── Projects
  ├── Skills
  ├── Experience
  └── Contact Info
──────────────
✍️ Blog
  ├── All Posts
  └── New Post
──────────────
📄 Resume
──────────────
📬 Messages (contact submissions)
──────────────
⚙️ Settings
──────────────
🔗 View Site (opens in new tab)
🚪 Logout
```

### Design System for Admin

- Use shadcn/ui components exclusively (Card, Form, Input, Textarea, Button, Dialog, Table, Tabs, Toast, Switch, Badge, Select, Skeleton)
- Light theme only for admin (dark mode not needed)
- Responsive: collapsible sidebar on mobile (hamburger menu)
- Breadcrumb navigation at top
- All forms use React Hook Form + Zod validation
- Toast notifications for all CRUD operations (success/error)
- Unsaved changes warning on navigation away

## Dashboard Home (`/admin`)

Overview cards showing:

- Total blog posts (published / drafts)
- Total projects
- Unread contact messages (with badge count)
- Last updated timestamp
- Quick links to edit each section

## Content Management Pages

### Pattern for ALL Content Editors

Every admin page follows this pattern:

1. **Server Component** loads current data from Supabase
2. **Client Component** form receives data as props
3. **Form** uses React Hook Form + Zod schema
4. **Server Action** validates + updates Supabase + calls `revalidateTag()`/`revalidatePath()`
5. **Toast** confirms success or shows error
6. **Image uploads** use Supabase Storage via client-side upload + store returned URL in DB

### Hero Section Editor (`/admin/hero`)

Form fields:

- Greeting text (text input)
- Name (text input)
- Rotating titles (dynamic list — add/remove/reorder items)
- Description (textarea)
- Primary CTA text + link
- Secondary CTA text + link
- Avatar image (file upload with preview + crop)
- Resume file upload (PDF)

### About Section Editor (`/admin/about`)

Form fields:

- Heading (text input)
- Bio (rich textarea with basic formatting — bold, italic, links)
- Portrait image (file upload with preview)
- Stats (dynamic key-value list — label + value pairs, add/remove/reorder)

### Projects Manager (`/admin/projects`)

**List view**: Table with columns: Thumbnail, Title, Featured (toggle), Published (toggle), Sort Order, Actions (Edit/Delete)

- Drag-and-drop reordering
- Bulk actions: Publish/Unpublish selected

**Edit/Create form**:

- Title (text input) → auto-generates slug (editable)
- Short description (textarea, 160 char limit for SEO)
- Long description (rich textarea)
- Thumbnail (file upload with preview)
- Additional images (multi-file upload with preview gallery, drag-to-reorder)
- Tech stack (tag input — type to add, click to remove)
- Live URL (URL input)
- GitHub URL (URL input)
- Featured toggle
- Published toggle

### Skills Manager (`/admin/skills`)

**List view**: Grouped by category with drag-and-drop reordering within groups

- Each skill shows: Icon preview, Name, Category, Published toggle
- Quick-add inline form at bottom of each category group

**Edit/Create form**:

- Name (text input)
- Category (select: Frontend, Backend, DevOps & Cloud, Databases, Tools & Other)
- Icon selection (searchable grid of tech icons from `devicons` or `simple-icons` — click to select)
- Or custom icon upload
- Published toggle

### Experience Manager (`/admin/experience`)

**List view**: Timeline-ordered table with: Company, Role, Dates, Published toggle, Actions

**Edit/Create form**:

- Company name (text input)
- Role / Title (text input)
- Location (text input)
- Start date (date picker)
- End date (date picker, or "Present" checkbox)
- Description (textarea)
- Key achievements (dynamic list — add/remove/reorder bullet points)
- Company logo (file upload or URL)
- Company website URL

### Contact Info Editor (`/admin/contact`)

Form fields:

- Contact email
- Contact form enabled (toggle)
- Social links (dynamic key-value: platform name + URL)
  - Pre-defined: GitHub, LinkedIn, Twitter/X, Email
  - Custom: add more

### Contact Messages (`/admin/messages`)

**List view**: Table with: Name, Email, Subject, Date, Read status (badge), Actions

- Click row to expand/view full message
- Mark as read/unread
- Delete message
- Filter: All / Unread / Read
- Sort by newest first

### Settings (`/admin/settings`)

Form fields:

- Site title
- Site description (used as default meta description)
- Default OG image (file upload)
- Google Analytics measurement ID
- Maintenance mode toggle (shows "Coming soon" page to public)

## Image Upload Component

Create a reusable `<ImageUpload />` component:

```
Props:
  bucket: string          — Supabase storage bucket name
  folder?: string         — Subfolder within bucket
  currentUrl?: string     — Current image URL (for preview)
  onUpload: (url: string) => void  — Callback with new URL
  maxSize?: number        — Max file size in MB (default: 5)
  accept?: string         — Accepted MIME types (default: "image/*")
  aspectRatio?: string    — Crop aspect ratio (optional)
```

Behavior:

1. Show current image preview (or placeholder)
2. Click to open file picker
3. Client-side validation (size, type)
4. Upload directly to Supabase Storage from browser (using anon key + RLS)
5. Generate unique filename: `{folder}/{timestamp}-{random}.{ext}`
6. Return public URL via callback
7. Show upload progress indicator
8. Option to remove current image

## Server Actions Pattern

All mutations go through Server Actions (NOT API routes) for type safety:

```typescript
// Example: /app/(admin)/admin/hero/actions.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { z } from "zod"

const heroSchema = z.object({
  name: z.string().min(1),
  greeting: z.string().min(1),
  rotating_titles: z.array(z.string()).min(1),
  description: z.string(),
  // ... etc
})

export async function updateHero(formData: z.infer<typeof heroSchema>) {
  const supabase = await createServerClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Validate
  const validated = heroSchema.parse(formData)

  // Update
  const { error } = await supabase
    .from("hero_section")
    .update(validated)
    .eq("id", "the-hero-row-id")

  if (error) throw error

  // Revalidate public page cache
  revalidateTag("hero")
  revalidatePath("/")

  return { success: true }
}
```

## Dynamic List/Array Field Component

Create a reusable `<DynamicList />` for fields like rotating_titles, achievements, stats:

```
Props:
  items: string[]
  onItemsChange: (items: string[]) => void
  placeholder?: string
  maxItems?: number
```

Features:

- Add new item (text input + "Add" button)
- Remove item (X button)
- Drag-and-drop reorder (use `@dnd-kit/sortable`)
- Inline editing (click to edit)

## Form Validation Schemas

Use Zod schemas that match the database schema. Define them in `/lib/schemas/` so they can be shared between client validation and server validation:

```
/lib/schemas/
  hero.ts
  about.ts
  project.ts
  skill.ts
  experience.ts
  blog.ts
  resume.ts
  settings.ts
  contact.ts
```
