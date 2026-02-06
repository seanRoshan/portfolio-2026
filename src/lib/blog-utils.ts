/**
 * Generates a URL-friendly slug from a title.
 * Lowercases, replaces non-alphanumeric chars with hyphens, truncates to 80 chars.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/**
 * Calculates estimated read time from HTML content.
 * Strips tags, counts words, divides by 200 WPM. Min 1 minute.
 */
export function calculateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "")
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Extracts a plain-text excerpt from HTML content.
 * Strips tags, takes first `maxLength` characters, breaks at word boundary.
 */
export function extractExcerpt(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, "").trim()
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "..."
}
