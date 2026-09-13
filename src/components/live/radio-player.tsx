'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The live radio player.
 *
 * One button, one audio element, four equaliser bars. The bars animate only
 * while audio is genuinely playing, so the motion answers "is this live right
 * now" rather than decorating the page.
 *
 * THE STREAM MAY NOT EXIST. The AzuraCast server is client-managed and is not
 * provisioned yet, so `streamUrl` is null in every environment today. That is a
 * real state, not an error: the button renders visibly disabled and says so.
 * Offering a button that silently does nothing would be worse than offering
 * none, because a listener cannot tell a dead button from a slow connection.
 *
 * Live audio is not seekable. `src` is therefore set fresh on every play so a
 * resumed stream rejoins at the live edge instead of replaying whatever was
 * left in the buffer — which is what the listener means by "join at any time".
 */

type PlayerState = 'idle' | 'connecting' | 'playing' | 'error'

const STATUS_TEXT: Record<PlayerState, string> = {
  idle: 'Tap to listen live',
  connecting: 'Connecting…',
  playing: 'On air — live now',
  error: 'Stream unavailable — try again shortly',
}

export function RadioPlayer({ streamUrl }: { streamUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>('idle')

  const configured = Boolean(streamUrl)
  const playing = state === 'playing'

  // The browser can stop playback without us asking — connection dropped, the
  // OS took the audio focus, the listener hit a hardware media key. Without
  // these listeners the button would keep claiming to be playing and the bars
  // would keep moving over silence.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlaying = () => setState('playing')
    const onPause = () => setState((s) => (s === 'error' ? s : 'idle'))
    const onError = () => setState('error')
    const onWaiting = () => setState((s) => (s === 'playing' ? 'connecting' : s))

    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('stalled', onWaiting)

    return () => {
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('stalled', onWaiting)
    }
  }, [])

  async function toggle() {
    const audio = audioRef.current
    if (!audio || !streamUrl) return

    if (playing || state === 'connecting') {
      audio.pause()
      // Drop the source so a paused stream stops downloading in the
      // background. On cellular data that is somebody's money.
      audio.removeAttribute('src')
      audio.load()
      setState('idle')
      return
    }

    setState('connecting')
    audio.src = streamUrl
    try {
      await audio.play()
    } catch {
      // Autoplay policy rejection, or the stream host is unreachable. Either
      // way the honest report is the same: it did not start.
      setState('error')
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-paper-sunken p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!configured}
          aria-pressed={playing}
          aria-describedby="radio-status"
          className="pressable inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green text-paper transition-colors hover:bg-green-deep disabled:cursor-not-allowed disabled:bg-ink-faint disabled:opacity-60"
        >
          <span className="sr-only">
            {playing ? 'Pause the live stream' : 'Play the live stream'}
          </span>
          {playing || state === 'connecting' ? <PauseIcon /> : <PlayIcon />}
        </button>

        <Equaliser playing={playing} />

        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Heartland JA Radio</p>
          {/*
            aria-live so a screen reader hears the state change that the bars
            communicate visually. `polite` — it must not interrupt.
          */}
          <p
            id="radio-status"
            aria-live="polite"
            className="mt-0.5 text-xs text-ink-faint"
          >
            {configured ? STATUS_TEXT[state] : 'Stream starting soon'}
          </p>
        </div>
      </div>

      {/*
        preload="none" is load-bearing, not a default worth inheriting: without
        it the browser begins pulling a continuous stream on page load, on a
        page budgeted at 500KB over Jamaican cellular data.
      */}
      <audio ref={audioRef} preload="none" />
    </div>
  )
}

/**
 * Four bars. `eq-playing` is what starts them — see the keyframes in
 * globals.css for why the durations are unequal.
 *
 * aria-hidden: this says exactly what the status line already says in words.
 */
function Equaliser({ playing }: { playing: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-8 shrink-0 items-end gap-1 ${playing ? 'eq-playing' : ''}`}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`eq-bar w-1 rounded-full ${playing ? 'bg-green' : 'bg-rule-strong'}`}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Nudged right by 1px: a triangle centred on its bounding box reads as
          sitting left inside a circle. */}
      <path d="M9 6.5v11a.5.5 0 0 0 .77.42l8.2-5.5a.5.5 0 0 0 0-.84l-8.2-5.5A.5.5 0 0 0 9 6.5Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="8" y="6" width="3" height="12" rx="1" />
      <rect x="13" y="6" width="3" height="12" rx="1" />
    </svg>
  )
}
