/**
 * Renders a JSON-LD block.
 *
 * Server component — the structured data is in the HTML the crawler receives,
 * with no client JavaScript involved.
 *
 * `JSON.stringify` output is escaped for `<` so a string value inside the data
 * can never close the script tag early. Values here originate from our own
 * database, but a listing description is editor-supplied text and this is the
 * one place it could break out of context.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
