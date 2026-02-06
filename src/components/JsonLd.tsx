/**
 * Generic JSON-LD renderer — server component.
 * Renders structured data inline so crawlers see it immediately.
 *
 * Safe to use dangerouslySetInnerHTML here because JSON.stringify()
 * output cannot contain unescaped HTML — script[type=application/ld+json]
 * is not parsed as HTML by the browser.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data]

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}
