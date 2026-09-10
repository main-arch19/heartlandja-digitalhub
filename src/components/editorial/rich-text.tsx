import { generateHTML } from '@tiptap/html/server'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'

import type { RichTextDoc } from '@/types/db'

/**
 * Server-side rich text rendering.
 *
 * Bodies are stored as Tiptap JSON, not HTML. Rendering happens here, on the
 * server, from a fixed extension set — so a body can only ever produce the
 * nodes and marks configured below. There is no path from stored content to
 * arbitrary markup, which is why this is safe to inject.
 *
 * This also means the editor ships no rendering code to the visitor: a reader
 * downloads HTML, not Tiptap.
 */

/**
 * StarterKit already includes Link in Tiptap 3, so it is configured through
 * StarterKit rather than added again — registering it twice would leave the
 * duplicate's config (including `rel="noopener noreferrer"`) silently ignored.
 */
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    },
  }),
  Image.configure({
    HTMLAttributes: { loading: 'lazy', decoding: 'async' },
  }),
]

export function renderRichText(doc: RichTextDoc | null | undefined): string | null {
  if (!doc || !doc.content || doc.content.length === 0) return null
  try {
    return generateHTML(doc as never, extensions)
  } catch (error) {
    console.error('[rich-text] failed to render document', error)
    return null
  }
}

interface RichTextProps {
  doc: RichTextDoc | null | undefined
  className?: string
}

export function RichText({ doc, className }: RichTextProps) {
  const html = renderRichText(doc)
  if (!html) return null

  return (
    <div
      className={className ?? 'prose-editorial'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Plain text extraction, for meta descriptions and excerpts. */
export function richTextToPlainText(doc: RichTextDoc | null | undefined): string {
  if (!doc?.content) return ''

  const parts: string[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; text?: string; content?: unknown[] }
    if (n.type === 'text' && typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }

  doc.content.forEach(walk)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
