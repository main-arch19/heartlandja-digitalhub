import Image from 'next/image'

/**
 * Editorial imagery.
 *
 * THE GOVERNING RULE: when there is no image, this renders **nothing** — not a
 * grey box, not a placeholder frame, not an icon in a dashed rectangle. An
 * empty slot advertises an absence; no slot at all simply reads as a design
 * that did not call for a picture there.
 *
 * That matters more here than on most sites. Every business and story in the
 * development seed is fictional, and the site is publicly crawlable. A
 * placeholder frame captioned with a real Clarendon town would be a fake
 * photograph of a real place — so the empty state has to be a finished state,
 * not a promise.
 *
 * `next/image` is already configured for AVIF then WebP with device sizes
 * tuned for mid-range Android (see next.config.ts), and remote images are
 * restricted to the Supabase storage host. Local assets under /public work
 * without further configuration.
 */

interface EditorialImageProps {
  src: string | null | undefined
  alt: string | null | undefined
  /** Aspect ratio of the frame. Editorial default is 3:2. */
  ratio?: '3/2' | '16/9' | '1/1' | '4/5'
  /** Responsive sizes hint — always pass one, or Next serves the largest. */
  sizes: string
  /** Above the fold? The lead story's hero is, almost nothing else is. */
  priority?: boolean
  className?: string
}

const RATIO_CLASS: Record<NonNullable<EditorialImageProps['ratio']>, string> = {
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
}

export function EditorialImage({
  src,
  alt,
  ratio = '3/2',
  sizes,
  priority = false,
  className,
}: EditorialImageProps) {
  if (!src) return null

  return (
    <div
      className={`relative overflow-hidden rounded-sm bg-paper-sunken ${RATIO_CLASS[ratio]} ${className ?? ''}`}
    >
      <Image
        src={src}
        /*
         * Empty alt, not a manufactured one. Every image here sits beside a
         * headline or a business name that already names the subject, so an
         * invented description would be read out twice. An image with no
         * recorded alt text is decorative by definition — saying so is more
         * correct than guessing.
         */
        alt={alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  )
}

/**
 * A business with no logo.
 *
 * This is the one place a fallback earns its keep: a directory card is a grid
 * cell, and a missing logo leaves a visible hole where its neighbours have
 * one. A monogram is honest — it invents no imagery, it just sets the
 * business's own initials in the display face.
 */
export function BusinessMonogram({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .replace(/["'’]/g, '')
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-green-wash font-display text-base font-semibold text-green ${className ?? ''}`}
    >
      {initials || '·'}
    </span>
  )
}

/**
 * A listing's logo, or its monogram. Always renders something, because this
 * one sits in a grid where a gap would be conspicuous.
 */
export function BusinessMark({
  name,
  logoUrl,
  className,
}: {
  name: string
  logoUrl: string | null | undefined
  className?: string
}) {
  if (!logoUrl) return <BusinessMonogram name={name} className={className} />

  return (
    <span
      className={`relative inline-block size-11 shrink-0 overflow-hidden rounded-sm bg-paper-sunken ${className ?? ''}`}
    >
      <Image
        src={logoUrl}
        alt=""
        fill
        sizes="44px"
        className="object-contain"
      />
    </span>
  )
}
