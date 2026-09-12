'use client'

import Image from '@tiptap/extension-image'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'

import type { RichTextDoc } from '@/types/db'

/**
 * The writing surface for news, history and articles.
 *
 * Built for someone who is not a developer. The toolbar carries only what a
 * parish reporter actually needs — headings, bold, italic, lists, quote, link —
 * and nothing that would let them build a layout or break the design.
 *
 * The document is Tiptap JSON, matching the `body jsonb` column and the
 * server-side renderer in components/editorial/rich-text.tsx. The SAME
 * extension set is configured in both places: if they diverge, an editor could
 * write a node the renderer silently drops. Keep them in step.
 *
 * The value is mirrored into a hidden input so the surrounding <form> submits
 * it through a plain server action, like every other form in this admin.
 */

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    },
  }),
  Image.configure({
    HTMLAttributes: { loading: 'lazy', decoding: 'async' },
  }),
]

const EMPTY_DOC: RichTextDoc = { type: 'doc', content: [] }

export function RichTextEditor({
  name,
  defaultValue,
  label,
}: {
  /** Form field name — the JSON lands here on submit. */
  name: string
  defaultValue?: RichTextDoc | null
  label: string
}) {
  const [json, setJson] = useState<string>(
    JSON.stringify(defaultValue ?? EMPTY_DOC),
  )

  const editor = useEditor({
    extensions: EXTENSIONS,
    // `RichTextDoc` types `content` as unknown[] on purpose — the database
    // layer should not depend on Tiptap's types. Tiptap validates the document
    // against its own schema on load regardless, so the cast is safe here and
    // keeps the dependency pointing one way.
    content: (defaultValue ?? EMPTY_DOC) as never,
    // Tiptap renders on the client only; without this Next warns about a
    // hydration mismatch on every load of the editor.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-editorial min-h-[18rem] max-w-none rounded-b-sm border border-t-0 border-rule-strong bg-paper-raised px-4 py-3 focus:outline-none',
        'aria-label': label,
      },
    },
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  })

  // No effect syncing editor -> state here. `json` is already seeded from the
  // same `defaultValue` the editor loads, and `onUpdate` keeps it current from
  // the first keystroke. Mirroring in an effect would set state during render
  // for no gain.

  if (!editor) {
    return (
      <div className="mt-1 min-h-[21rem] rounded-sm border border-rule-strong bg-paper-sunken px-4 py-3 text-sm text-ink-faint">
        Loading the editor…
      </div>
    )
  }

  return (
    <div className="mt-1">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={json} />
      <p className="mt-1.5 text-xs text-ink-faint">
        Write the story in full. Use Heading 2 for section breaks within a long
        piece — the headline above is already the page title.
      </p>
    </div>
  )
}

type EditorInstance = NonNullable<ReturnType<typeof useEditor>>

function Toolbar({ editor }: { editor: EditorInstance }) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 rounded-t-sm border border-rule-strong bg-paper-sunken px-2 py-1.5"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <Divider />

      {([2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive('heading', { level })}
          label={`Heading ${level}`}
        >
          H{level}
        </ToolbarButton>
      ))}

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label="Bulleted list"
      >
        • List
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label="Numbered list"
      >
        1. List
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        label="Quote"
      >
        Quote
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
            return
          }
          // window.prompt is deliberate: a custom modal here would be more
          // code and more to go wrong, for a field an editor uses occasionally.
          const url = window.prompt('Link address (https://…)')
          if (!url) return
          const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`
          editor.chain().focus().setLink({ href: safe }).run()
        }}
        active={editor.isActive('link')}
        label={editor.isActive('link') ? 'Remove link' : 'Add link'}
      >
        {editor.isActive('link') ? 'Unlink' : 'Link'}
      </ToolbarButton>
    </div>
  )
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-rule-strong" />
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void
  active: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={
        active
          ? 'pressable inline-flex h-8 min-w-8 items-center justify-center rounded-sm bg-green px-2 text-xs font-medium text-paper'
          : 'pressable inline-flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-paper-raised hover:text-green'
      }
    >
      {children}
    </button>
  )
}
