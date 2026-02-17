/**
 * Generic JSON-LD renderer — server component.
 * Renders structured data inline so crawlers see it immediately.
 *
 * Uses dangerouslySetInnerHTML with XSS sanitization: all `<` characters
 * are replaced with the unicode escape `\u003c` to prevent injection of
 * closing </script> tags. This follows the Next.js recommended pattern.
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data]

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
