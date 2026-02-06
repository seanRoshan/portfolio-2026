# 05 — Skills Section Redesign

## The Problem with the Current Design

Looking at the uploaded screenshot, the current skills section has major issues:

1. **Percentage bars imply self-assessment** — "70% WebGL" tells the viewer nothing meaningful. 70% of what? Compared to whom? It invites scrutiny rather than confidence.
2. **Low percentages hurt you** — Showing "70%" on anything signals weakness. A hiring manager sees "not proficient" rather than "knows WebGL."
3. **Bars invite comparison** — If React is 95% and Vue is 80%, the viewer wonders why Vue is lower instead of noting you know both.
4. **Career advisors universally recommend against skill percentages** — They're subjective, unverifiable, and can disqualify you from roles where you'd actually perform well.

## Career Advisor Recommendations

1. **Only list technologies you're confident discussing in an interview** — If you can't answer 3 deep questions about it, don't list it.
2. **Group by category** to show breadth across the stack.
3. **Don't rank within categories** — Listing "React, Vue, Angular" without bars implies competence in all three.
4. **Use recognizable tech icons** — Visual recognition is faster than reading text.
5. **Let your projects demonstrate depth** — The projects section proves proficiency better than any percentage bar.
6. **Consider "Primary" vs "Familiar" groupings** if you want to show depth without percentages — but keep it to two tiers maximum.

## New Design: Icon Grid with Categories

### Visual Design

```
╔══════════════════════════════════════════════════════╗
║  SKILLS & EXPERTISE                                  ║
║                                                      ║
║  Tools and technologies I work with                  ║
║                                                      ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ [ Frontend ]  [ Backend ]  [ DevOps & Cloud ]   │ ║
║  │ [ Databases ] [ Tools & Testing ]               │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                      ║
║  When "Frontend" is selected:                        ║
║                                                      ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    ║
║  │  ⚛️    │  │  ▲     │  │  TS    │  │  🟢   │    ║
║  │ React  │  │Next.js │  │  Type  │  │  Vue   │    ║
║  │        │  │        │  │ Script │  │        │    ║
║  └────────┘  └────────┘  └────────┘  └────────┘    ║
║                                                      ║
║  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    ║
║  │  🎨   │  │  💨   │  │  🎬   │  │  🖼️   │    ║
║  │  CSS3  │  │Tailwind│  │ GSAP  │  │  HTML  │    ║
║  │        │  │  CSS   │  │       │  │   5    │    ║
║  └────────┘  └────────┘  └────────┘  └────────┘    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

### Design Details

**Section Header**:

- Subtitle: "SKILLS & EXPERTISE" (small, blue/accent, uppercase tracking)
- Title: "Tools and technologies I work with" (large, bold, black)
- Changed from "I master" (too aggressive) to "I work with" (confident but humble)

**Category Tabs**:

- Horizontal pill-style tabs (like the current design — keep this, it works)
- Active tab: filled accent color with white text
- Inactive: transparent with subtle border
- Animated underline or background transition on tab switch
- Sticky on scroll within the section

**Skill Cards** (the core redesign):

- Grid layout: 4 columns desktop, 3 tablet, 2 mobile
- Each card:
  - Technology icon (from `devicons` / `simple-icons` / custom SVG)
  - Technology name below icon
  - Subtle background (light gray or glassmorphism)
  - Rounded corners (8-12px)
  - On hover: gentle lift (translateY -4px), subtle shadow increase, icon color animation
  - Scroll-triggered stagger animation (fade in + slide up, 0.05s delay between cards)
- NO percentages, NO progress bars, NO proficiency levels

**Icon Source**: Use `devicon` icons (https://devicon.dev/) — they have high-quality SVGs for virtually every tech. Install via:

```bash
npm install devicons # or use CDN / copy SVGs to public/icons/
```

Alternative: `react-icons` with the `Si` (Simple Icons) set:

```bash
npm install react-icons
```

Then: `import { SiReact, SiNextdotjs, SiTypescript } from 'react-icons/si'`

**Icon Mapping**: Store icon identifiers in the database `skills.icon_name` field. Map to actual icon components:

```typescript
// /lib/tech-icons.ts
import { SiReact, SiNextdotjs, SiTypescript, SiNodedotjs, SiDocker, ... } from 'react-icons/si'

export const techIcons: Record<string, React.ComponentType> = {
  'react': SiReact,
  'nextjs': SiNextdotjs,
  'typescript': SiTypescript,
  'nodejs': SiNodedotjs,
  'docker': SiDocker,
  // ... etc
}
```

### Animation Behavior

1. **Tab switching**: Content area cross-fades between categories using Motion `AnimatePresence` + `layout` animations
2. **Cards entrance**: Staggered fade-in + slide-up on scroll (GSAP ScrollTrigger)
3. **Card hover**: Spring-based lift animation (Motion)
4. **Icon hover**: Subtle color shift to the technology's brand color (React = #61DAFB, etc.)
5. **Respect `prefers-reduced-motion`**: Skip entrance animations, keep hover states

### "Tools" Row (Bottom)

Below the main grid, keep a secondary row of supplementary tools (Git, Linux, Vim, Figma, etc.) as smaller, text-only pills/badges:

```
──────────────────────────────────────────────
Also experienced with:
[ Git ]  [ Linux ]  [ Figma ]  [ Vim ]  [ Jest ]  [ Cypress ]  [ Playwright ]
──────────────────────────────────────────────
```

These are displayed as subtle, smaller badges — not as prominent as the main skill cards. This signals "I know these too" without cluttering the main grid.

### Alternative Layout Option: Marquee/Scrolling

If the icon grid feels too static, consider a continuous scrolling marquee of tech icons (like a "logo wall" that many modern sites use):

```
← React  Next.js  TypeScript  Node.js  Docker  AWS  PostgreSQL  →
   (auto-scrolling, pauses on hover)
```

This works well for:

- Large number of skills
- Visual interest
- Avoiding the "grid of boxes" look

Implementation: CSS animation (`translateX`) with duplicated items for infinite loop. Pause on hover.

**However**: The tabbed grid is better for portfolios because it's organized and scannable. Use marquee only as a secondary "tech ticker" if desired.

## Admin: Skills Management

The admin skills page should:

1. Show skills grouped by category
2. Allow drag-and-drop reordering within each group
3. Provide a searchable icon picker (type "react" → see React icon + variations)
4. Preview how the card looks before saving
5. Toggle `published` and `show_on_resume` independently

## Data Model Reminder

From the database schema in `01-INFRASTRUCTURE.md`:

```sql
skills (
  id, name, category, icon_name, icon_url,
  sort_order, published, show_on_resume, created_at
)
```

Categories: `frontend`, `backend`, `devops`, `database`, `tools`
