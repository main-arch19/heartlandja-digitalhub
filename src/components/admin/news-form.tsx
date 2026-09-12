'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { saveNewsPost, type ActionResult } from '@/lib/data/mutations'
import { CLARENDON_TOWNS, NEWS_CATEGORY_LABELS } from '@/lib/constants'
import type { NewsPost, UserRole } from '@/types/db'

import { RichTextEditor } from './rich-text-editor'

/**
 * The news editor.
 *
 * This is the form the whole brief turns on: Ventley and his contributors
 * filing a weekly story without a developer. Everything here is shaped for
 * someone writing under time pressure who is not technical.
 *
 * Two save buttons rather than a status dropdown — "Save draft" and "Publish"
 * are the two things an editor actually wants to do, and naming them removes a
 * step and a decision. A contributor only sees the draft button, because
 * publishing is an editor's call (enforced in the action and by RLS).
 *
 * The web address is derived from the headline and shown read-only until the
 * editor chooses to change it. Once a story is published its URL is permanent —
 * changing it breaks every link anyone has shared.
 */

const fieldClass =
  'tap-target mt-1 w-full rounded-sm border border-rule-strong bg-paper-raised px-3 py-2 text-[0.9375rem] text-ink focus:border-green focus:outline-none'

function toSlug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function SaveButton({
  status,
  children,
  variant,
}: {
  status: string
  children: React.ReactNode
  variant: 'primary' | 'secondary'
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending}
      className={
        variant === 'primary'
          ? 'pressable tap-target inline-flex items-center rounded-sm bg-green px-6 text-sm font-medium text-paper transition-colors hover:bg-green-deep disabled:opacity-60'
          : 'pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green disabled:opacity-60'
      }
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}

export function NewsForm({
  post,
  role,
}: {
  post?: NewsPost | null
  role: UserRole
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    saveNewsPost,
    null,
  )

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [editingSlug, setEditingSlug] = useState(false)

  const canPublish = role === 'admin' || role === 'editor'
  const effectiveSlug = slug || toSlug(title)
  const isPublished = post?.status === 'published'

  return (
    <form action={formAction} className="space-y-6">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}

      {state?.message ? (
        <p
          role="status"
          className={
            state.ok
              ? 'rounded-sm border border-green/30 bg-green-wash px-4 py-3 text-sm'
              : 'rounded-sm border border-danger/30 bg-danger-wash px-4 py-3 text-sm'
          }
        >
          {state.message}
        </p>
      ) : null}

      {/* Headline */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Headline <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={state?.fieldErrors?.title ? true : undefined}
          className={`${fieldClass} font-display text-lg`}
        />
        {state?.fieldErrors?.title ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      {/* Web address */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Web address
        </label>
        {editingSlug ? (
          <>
            <input
              id="slug"
              name="slug"
              type="text"
              value={effectiveSlug}
              onChange={(e) => setSlug(e.target.value)}
              className={fieldClass}
            />
            {isPublished ? (
              <p className="mt-1 text-xs text-danger">
                This story is published. Changing its address will break any link
                already shared.
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="rounded-sm bg-paper-sunken px-2 py-1.5 text-xs text-ink-muted">
              /news/{effectiveSlug || '…'}
            </code>
            <input type="hidden" name="slug" value={effectiveSlug} />
            <button
              type="button"
              onClick={() => setEditingSlug(true)}
              className="link-target text-xs text-green underline underline-offset-2"
            >
              Edit
            </button>
          </div>
        )}
        {state?.fieldErrors?.slug ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.slug}</p>
        ) : null}
      </div>

      {/* Category and town */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={post?.category ?? 'community_events'}
            className={fieldClass}
          >
            {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="town" className="block text-sm font-medium">
            Town or district
          </label>
          <input
            id="town"
            name="town"
            type="text"
            list="clarendon-towns"
            defaultValue={post?.town ?? ''}
            className={fieldClass}
          />
          <datalist id="clarendon-towns">
            {CLARENDON_TOWNS.map((town) => (
              <option key={town} value={town} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-ink-faint">
            Used to show local businesses alongside the story.
          </p>
        </div>
      </div>

      {/* Standfirst */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium">
          Standfirst
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={400}
          defaultValue={post?.excerpt ?? ''}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-ink-faint">
          One or two sentences shown under the headline and in search results.
        </p>
      </div>

      {/* Body */}
      <div>
        <span className="block text-sm font-medium">
          The story <span className="text-danger" aria-hidden="true">*</span>
        </span>
        <RichTextEditor name="body" defaultValue={post?.body} label="Story body" />
        {state?.fieldErrors?.body ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.body}</p>
        ) : null}
      </div>

      {/* Search appearance — collapsed by default; most stories need no override */}
      <details className="rounded-sm border border-rule bg-paper-sunken p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Search appearance (optional)
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Leave these blank and the headline and standfirst are used, which is
          usually right. Fill them in only to word the search result differently.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="seo_title" className="block text-sm font-medium">
              Search title
            </label>
            <input
              id="seo_title"
              name="seo_title"
              type="text"
              defaultValue={post?.seo_title ?? ''}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="seo_description" className="block text-sm font-medium">
              Search description
            </label>
            <textarea
              id="seo_description"
              name="seo_description"
              rows={2}
              defaultValue={post?.seo_description ?? ''}
              className={fieldClass}
            />
          </div>
        </div>
      </details>

      <input
        type="hidden"
        name="publish_date"
        value={post?.publish_date ?? ''}
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <SaveButton status="draft" variant="secondary">
          Save draft
        </SaveButton>

        {canPublish ? (
          <SaveButton status="published" variant="primary">
            {isPublished ? 'Update published story' : 'Publish'}
          </SaveButton>
        ) : (
          <p className="text-xs text-ink-faint">
            An editor will review and publish your draft.
          </p>
        )}

        <Link
          href="/admin/news"
          className="link-target text-sm text-ink-muted underline underline-offset-2 hover:text-green"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
