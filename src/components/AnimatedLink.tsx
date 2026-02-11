import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Animation registry ─────────────────────────────────────────────
// Ordered list of all available link hover animations.
// Used by AnimationPicker for preview and by AnimatedLink for rendering.

export const LINK_ANIMATIONS = [
  { id: "underline-slide", label: "Underline Slide", category: "Underlines" },
  { id: "underline-center", label: "Underline Center", category: "Underlines" },
  { id: "underline-right", label: "Underline Right", category: "Underlines" },
  { id: "underline-thick", label: "Underline Thick", category: "Underlines" },
  { id: "underline-double", label: "Underline Double", category: "Underlines" },
  { id: "underline-gradient", label: "Underline Gradient", category: "Underlines" },
  { id: "underline-grow", label: "Underline Grow", category: "Underlines" },
  { id: "underline-wave", label: "Underline Wave", category: "Underlines" },
  { id: "fill-left", label: "Fill Left", category: "Background Fills" },
  { id: "fill-right", label: "Fill Right", category: "Background Fills" },
  { id: "fill-up", label: "Fill Up", category: "Background Fills" },
  { id: "fill-down", label: "Fill Down", category: "Background Fills" },
  { id: "fill-center", label: "Fill Center", category: "Background Fills" },
  { id: "fill-diagonal", label: "Fill Diagonal", category: "Background Fills" },
  { id: "text-up", label: "Text Up", category: "Text Transforms" },
  { id: "text-tracking", label: "Text Tracking", category: "Text Transforms" },
  { id: "text-weight", label: "Text Weight", category: "Text Transforms" },
  { id: "text-scale", label: "Text Scale", category: "Text Transforms" },
  { id: "text-skew", label: "Text Skew", category: "Text Transforms" },
  { id: "text-blur-in", label: "Text Blur In", category: "Text Transforms" },
  { id: "text-color-sweep", label: "Color Sweep", category: "Text Transforms" },
  { id: "text-glow", label: "Text Glow", category: "Text Transforms" },
  { id: "bracket-left", label: "Bracket Left", category: "Borders" },
  { id: "bracket-both", label: "Bracket Both", category: "Borders" },
  { id: "border-box", label: "Border Box", category: "Borders" },
  { id: "border-bottom-thick", label: "Border Bottom", category: "Borders" },
  { id: "rotate-subtle", label: "Rotate Subtle", category: "Creative" },
  { id: "flip-letter", label: "Flip Letter", category: "Creative" },
  { id: "highlight-marker", label: "Highlight Marker", category: "Creative" },
  { id: "strikethrough", label: "Strikethrough", category: "Creative" },
  { id: "text-wave", label: "Text Wave", category: "Creative" },
] as const

export type LinkAnimationId = (typeof LINK_ANIMATIONS)[number]["id"]

// ── Component ──────────────────────────────────────────────────────

interface AnimatedLinkProps {
  href: string
  children: React.ReactNode
  animation: string
  className?: string
  external?: boolean
}

export function AnimatedLink({
  href,
  children,
  animation,
  className,
  external,
}: AnimatedLinkProps) {
  const animClass = animation && animation !== "none" ? `link-hover-${animation}` : ""

  if (external || href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(animClass, className)}
      >
        {children}
      </a>
    )
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} className={cn(animClass, className)}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={cn(animClass, className)}>
      {children}
    </Link>
  )
}
