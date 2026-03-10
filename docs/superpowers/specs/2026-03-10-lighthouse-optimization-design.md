# Lighthouse Optimization — Performance & Accessibility

**Date:** 2026-03-10
**Baseline Scores:** Performance 64, Accessibility 93, Best Practices 100, SEO 100
**Target Scores:** Performance ~95+, Accessibility 100

## Baseline Metrics

| Metric | Value | Rating |
|--------|-------|--------|
| FCP | 0.3s | Good |
| LCP | 1.2s | Good |
| TBT | 950ms | Poor |
| CLS | 0 | Good |
| Speed Index | 2.3s | Needs improvement |

## Section 1: Image Optimization

**Problem:** All public-facing `<Image>` components use `unoptimized`, bypassing Next.js/Vercel image optimization. Images served as JPEG at original resolution (e.g., 2731x1536 displayed at 396x221). Total estimated savings: 5,716 KiB.

**Fix:** Remove `unoptimized` from public-facing components and add proper `sizes` attributes.

### Files & Changes

| File | Images | Change |
|------|--------|--------|
| `src/components/sections/Projects.tsx` | Card hero, modal hero, architecture, gallery, lightbox (5 instances) | Remove `unoptimized`, add `sizes` per context |
| `src/components/sections/About.tsx` | Portrait (1 instance) | Remove `unoptimized` (already has `sizes`) |
| `src/components/sections/Ventures.tsx` | Venture logos (3 instances) | Remove `unoptimized` |
| `src/components/sections/Experience.tsx` | Company logos (4 instances) | Remove `unoptimized` |
| `src/components/sections/Credentials.tsx` | Cert images (2 instances) | Remove `unoptimized` |
| `src/app/(public)/blog/blog-listing.tsx` | Blog thumbnails (1 instance) | Remove `unoptimized` |
| `src/app/(public)/blog/[slug]/page.tsx` | Blog hero image (1 instance) | Remove `unoptimized` |

Admin components (`admin/projects/`, `admin/blog/`, `admin/ventures/`, `image-upload.tsx`, `multi-image-upload.tsx`) keep `unoptimized` — not measured by Lighthouse and optimization could interfere with upload previews.

### Sizes Attributes

- **Project cards** (3-col grid): `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`
- **Project modal hero** (max-w-4xl = 896px): `sizes="(max-width: 896px) 100vw, 896px"`
- **Gallery grid** (2-col in modal): `sizes="(max-width: 896px) 50vw, 400px"`
- **Lightbox**: `sizes="90vw"` (max-w-[90vw])
- **Architecture diagram**: `sizes="(max-width: 896px) 100vw, 800px"`
- **Venture logos**: `sizes="280px"` (max-w-full but small)
- **Experience logos**: Small fixed dimensions, no `sizes` needed (already have explicit width/height)

## Section 2: Mouse Animation Performance

**Problem:** `useMousePosition` hook calls `setState` on every `mousemove` event, causing the Hero component (and its children) to re-render ~60 times/second. `CustomCursor` re-attaches all event listeners when `isVisible` state changes.

### Fix: useMousePosition.ts → ref-based

Rewrite to accept element refs and apply transforms directly:

```typescript
export function useParallaxOnMouse(
  refs: { ref: RefObject<HTMLElement>; x: number; y: number }[]
) {
  useEffect(() => {
    let rafId: number
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2
        const ny = (e.clientY / window.innerHeight - 0.5) * 2
        refs.forEach(({ ref, x, y }) => {
          if (ref.current) {
            ref.current.style.transform = `translate(${nx * x}px, ${ny * y}px)`
          }
        })
      })
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [refs])
}
```

No React state, no re-renders. Transforms applied directly to DOM.

### Fix: CustomCursor.tsx

- Replace `isVisible` useState with `useRef<boolean>(false)` — set via `.current` in the mousemove handler, toggle visibility via `cursorRef.current.style.opacity`
- Remove `isVisible` from useEffect dependency array so listeners attach once
- Remove `isHovering` useState — apply hover styles directly via GSAP in the mouseenter/mouseleave handlers instead of React state

### Fix: Hero.tsx

- Replace `useMousePosition()` call with `useParallaxOnMouse()` passing refs to the three blob divs
- Remove `mouse` from render, eliminating inline style recalculation

## Section 3: Accessibility (93 → 100)

### ARIA Violations

**Problem:** `aria-label` on `<span>` (hero-greeting) and `<p>` (tagline) is prohibited. GSAP SplitText adds `aria-label` to preserve readable text after splitting into char/word nodes.

**Fix:** Pass `aria: { label: false }` to SplitText.create() config if supported in the version used. If not, remove the `aria-label` attribute after SplitText runs via `element.removeAttribute('aria-label')`. The split text is still readable to screen readers as individual characters.

**Files:** `Hero.tsx` (lines 98, 117, 150), `TextReveal.tsx` (SplitText usage)

### Contrast Failures

**Problem:** Footer section labels (NAVIGATE, MORE, SOCIAL, VENTURES) use `text-muted-foreground/60` which fails WCAG AA 4.5:1 contrast ratio.

**Fix:** Change `text-muted-foreground/60` → `text-muted-foreground` in `Footer.tsx` at lines 127, 141, 156, 176.

## Section 4: JS Bundle — TBT Reduction

**Problem:** TBT 950ms from 9 long tasks. 4.3s main-thread work, 1.8s JS execution time. GSAP + ScrollTrigger + SplitText + motion all load eagerly.

**Fix:** Dynamic import below-the-fold sections:

```typescript
// In the landing page
const Projects = dynamic(() => import("@/components/sections/Projects").then(m => ({ default: m.Projects })))
const Experience = dynamic(() => import("@/components/sections/Experience").then(m => ({ default: m.Experience })))
```

This defers parsing of GSAP ScrollTrigger animations for sections not visible on initial load, reducing TBT.

**Files:** Landing page component that assembles all sections (likely `src/app/(public)/page.tsx` or the layout).

## Expected Impact

| Change | Estimated Impact |
|--------|-----------------|
| Image optimization | +20-25 perf points (5.7MB → ~500KB) |
| Mouse animation fix | +5-10 perf points (TBT reduction) |
| Dynamic imports | +5 perf points (TBT reduction) |
| Accessibility fixes | +7 accessibility points (93 → 100) |
| **Total** | **~95+ Performance, 100 Accessibility** |

## Out of Scope

- Cache headers (controlled by Vercel/CDN config, not code changes)
- Legacy JavaScript elimination (14 KiB, minimal impact)
- DOM size optimization (not a major contributor at current size)
- Admin dashboard image optimization
