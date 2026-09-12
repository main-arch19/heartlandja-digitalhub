/**
 * Directory search.
 *
 * A plain GET form — no client component, no JavaScript required. The browser
 * navigates to /directory?q=..., the server renders results, and the result set
 * is a real shareable, crawlable URL.
 *
 * This is deliberately not a live-filtering input. Live filter would need the
 * whole dataset in the browser or a request per keystroke; on a mid-range
 * Android on cellular data, a single form submission is both faster and
 * cheaper, and it degrades to working HTML.
 */
export function DirectorySearch({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/directory" method="get" role="search" className="flex gap-2">
      <label htmlFor="directory-search" className="sr-only">
        Search Clarendon businesses
      </label>
      <input
        id="directory-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Plumber, restaurant, May Pen…"
        autoComplete="off"
        className="tap-target min-w-0 flex-1 rounded-sm border border-rule-strong bg-paper-raised px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
      />
      <button
        type="submit"
        className="pressable tap-target shrink-0 rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
      >
        Search
      </button>
    </form>
  )
}
