'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// Public status for a single image.
//   empty    — no src to load; the caller renders its placeholder
//   loading  — a request is in flight; the caller renders a skeleton
//   retrying — the previous attempt errored and the next one is on a backoff
//              timer; still a skeleton, but no <img> is mounted
//   loaded   — decoded and safe to paint
//   failed   — every attempt errored; the caller renders its placeholder
export type LazyImageStatus = 'empty' | 'loading' | 'retrying' | 'loaded' | 'failed'

// Total request attempts per URL, including the first. Three is enough to ride
// out a dropped connection or a cold storage edge without turning a genuine 404
// into a request storm.
export const MAX_ATTEMPTS = 3

// Delay before attempt N+1. The old implementation retried synchronously inside
// onError for a 4-second wall-clock window, which on a real 404 meant a tight
// error -> re-render -> error loop firing dozens of requests per broken image —
// multiplied by every card on an image-heavy grid. Backing off bounds that to
// MAX_ATTEMPTS requests spread over ~1s.
const BACKOFF_MS = [250, 750]

// How long a failure is remembered before the URL is worth trying again. Long
// enough that scrolling a virtualized grid past a broken card doesn't restart
// the retry ladder on every remount; short enough that a transient outage
// resolves on its own once the user scrolls back.
const FAILURE_TTL_MS = 30_000

// Upper bound on each outcome cache. The largest grid holds ~6.5k variants and
// the caches are keyed by URL string, so this keeps them bounded across a long
// session without ever evicting anything the user is currently looking at.
const CACHE_LIMIT = 4096

// Session-scoped memory of what each URL did last time.
//
// This is what makes the virtualized grids cheap. Rows mount and unmount
// constantly while scrolling, and without this every remount restarts from
// `loading` — a skeleton flash over an image the browser already has decoded,
// or a fresh retry ladder against a URL already known to be gone.
const loaded = new Set<string>()
const failed = new Map<string, number>()

function remember(src: string) {
  if (loaded.has(src)) return
  loaded.add(src)
  if (loaded.size > CACHE_LIMIT) {
    // Sets iterate in insertion order, so the first value is the oldest.
    const oldest = loaded.values().next().value
    if (oldest !== undefined) loaded.delete(oldest)
  }
}

function rememberFailure(src: string) {
  // Keep the original timestamp. Re-stamping on every remount would keep
  // pushing the TTL out, so a transiently broken URL would never be retried.
  if (failed.has(src)) return
  failed.set(src, Date.now())
  if (failed.size > CACHE_LIMIT) {
    const oldest = failed.keys().next().value
    if (oldest !== undefined) failed.delete(oldest)
  }
}

// Components currently sitting on `failed`. They re-arm when the tab regains
// connectivity — without this the failure cache would only clear for images
// that happen to remount after the network comes back.
const failedListeners = new Set<() => void>()

function clearFailures() {
  if (failed.size === 0) return
  failed.clear()
  for (const listener of failedListeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', clearFailures)
}

// Test seam: the caches are module state by design (they must outlive every
// component), so tests need an explicit way back to a clean slate.
export function resetLazyImageCache() {
  loaded.clear()
  failed.clear()
  failedListeners.clear()
}

function initialStatus(src: string | null | undefined): LazyImageStatus {
  if (!src) return 'empty'
  if (loaded.has(src)) return 'loaded'
  const failedAt = failed.get(src)
  if (failedAt !== undefined) {
    if (Date.now() - failedAt < FAILURE_TTL_MS) return 'failed'
    failed.delete(src)
  }
  return 'loading'
}

// Cache-bust the retry so a negative response already in the HTTP cache isn't
// replayed. Separator-aware: some callers pass URLs that already carry a query
// string (Supabase render/transform params, signed URLs).
function withAttempt(src: string, attempt: number) {
  if (attempt === 0) return src
  return `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`
}

export interface UseLazyImageResult {
  status: LazyImageStatus
  /** The URL to put on the <img>, or undefined when nothing should be mounted. */
  currentSrc: string | undefined
  /** Skeleton is up: a request is in flight or waiting on backoff. */
  isPending: boolean
  /** Nothing to paint — no src, or every attempt errored. Render the placeholder. */
  isPlaceholder: boolean
  isLoaded: boolean
  /** The preferred src failed and `fallbackSrc` took over. */
  isFallback: boolean
  /** Callback ref for the <img>. Also catches images that finished before hydration. */
  imgRef: (node: HTMLImageElement | null) => void
  handleLoad: () => void
  handleError: () => void
}

type State = {
  src: string | null | undefined
  fallbackSrc: string | null | undefined
  fallback: boolean
  status: LazyImageStatus
  attempt: number
}

function hasFallback(src: string | null | undefined, fallbackSrc: string | null | undefined) {
  return !!fallbackSrc && fallbackSrc !== src
}

function initialState(
  src: string | null | undefined,
  fallbackSrc: string | null | undefined
): State {
  const status = initialStatus(src)
  // A src already known to be dead skips straight to the fallback rather than
  // spending a request re-proving it.
  if (status === 'failed' && hasFallback(src, fallbackSrc)) {
    return { src, fallbackSrc, fallback: true, status: initialStatus(fallbackSrc), attempt: 0 }
  }
  return { src, fallbackSrc, fallback: false, status, attempt: 0 }
}

/**
 * @param src          the preferred URL
 * @param fallbackSrc  tried once if `src` errors, before giving up. Used for the
 *                     resized thumbnails in lib/image-transform.ts, which fall
 *                     back to the untransformed original.
 */
export function useLazyImage(
  src: string | null | undefined,
  fallbackSrc?: string | null
): UseLazyImageResult {
  // Both URLs travel with the state so a change resets attempt and status in the
  // same render it arrives, rather than one wasted commit later via useEffect.
  const [state, setState] = useState<State>(() => initialState(src, fallbackSrc))

  const stale = state.src !== src || state.fallbackSrc !== fallbackSrc
  const current = stale ? initialState(src, fallbackSrc) : state
  if (stale) setState(current)

  const { status, attempt, fallback } = current
  // The URL actually being requested — the fallback once the preferred one has
  // been ruled out. Everything below (caching, retries) keys off this.
  const activeSrc = fallback ? fallbackSrc : src
  const nodeRef = useRef<HTMLImageElement | null>(null)

  const handleLoad = useCallback(() => {
    setState((prev) => {
      if (prev.src !== src) return prev
      const active = prev.fallback ? prev.fallbackSrc : prev.src
      if (active) remember(active)
      return { ...prev, status: 'loaded' }
    })
  }, [src])

  const handleError = useCallback(() => {
    setState((prev) => {
      // Ignore errors from an <img> for a src we've already moved past, and from
      // a status that isn't actively awaiting a response.
      if (prev.src !== src || prev.status !== 'loading') return prev
      // First failure of the preferred URL hands over to the fallback right
      // away: it's a different resource, not a retry, so it gets no backoff and
      // a fresh attempt count.
      if (!prev.fallback && hasFallback(prev.src, prev.fallbackSrc)) {
        return { ...prev, fallback: true, attempt: 0, status: 'loading' }
      }
      const next = prev.attempt + 1
      return { ...prev, attempt: next, status: next >= MAX_ATTEMPTS ? 'failed' : 'retrying' }
    })
  }, [src])

  // Backoff between attempts. Flipping back to `loading` re-renders with a new
  // ?retry= param, which is what actually issues the next request.
  useEffect(() => {
    if (status !== 'retrying') return
    const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)]
    const id = setTimeout(() => {
      setState((prev) =>
        prev.src === src && prev.status === 'retrying' ? { ...prev, status: 'loading' } : prev
      )
    }, delay)
    return () => clearTimeout(id)
  }, [status, attempt, src])

  // Record outcomes only once the component has settled on them, so nothing is
  // written from inside a state updater (which StrictMode invokes twice).
  useEffect(() => {
    if (status !== 'failed') return
    if (src) rememberFailure(src)
    if (fallback && fallbackSrc) rememberFailure(fallbackSrc)
  }, [status, fallback, src, fallbackSrc])

  // The preferred URL is recorded as dead as soon as the fallback takes over,
  // not only when everything fails — otherwise every remount re-requests it.
  useEffect(() => {
    if (fallback && src) rememberFailure(src)
  }, [fallback, src])

  // Give up-to-date failures a way back: when connectivity returns, re-arm.
  useEffect(() => {
    if (status !== 'failed') return
    const listener = () => setState(initialState(src, fallbackSrc))
    failedListeners.add(listener)
    return () => {
      failedListeners.delete(listener)
    }
  }, [status, src, fallbackSrc])

  // These components are server-rendered, so the browser can finish (or fail)
  // an <img> before hydration attaches onLoad/onError — in which case neither
  // handler ever fires and the skeleton would sit there forever. Reading
  // `complete` when the node attaches covers both outcomes.
  //
  // Deferred to a microtask on purpose: ref callbacks run during React's commit
  // phase, and these grids are the ones where a state write there has already
  // produced "flushSync was called from inside a lifecycle method" (see the
  // comments in app/outfits/virtual-*-grid.tsx).
  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      nodeRef.current = node
      if (!node) return
      queueMicrotask(() => {
        if (nodeRef.current !== node || !node.complete) return
        if (node.naturalWidth > 0) handleLoad()
        else handleError()
      })
    },
    [handleLoad, handleError]
  )

  const isPlaceholder = status === 'empty' || status === 'failed'
  // No <img> during backoff: the old element is pointing at a URL that just
  // errored, and remounting it is what triggers the next request.
  const mountImg = !!activeSrc && !isPlaceholder && status !== 'retrying'
  const currentSrc = mountImg ? withAttempt(activeSrc, attempt) : undefined

  return {
    status,
    currentSrc,
    isPending: status === 'loading' || status === 'retrying',
    isPlaceholder,
    isLoaded: status === 'loaded',
    isFallback: fallback,
    imgRef,
    handleLoad,
    handleError,
  }
}
