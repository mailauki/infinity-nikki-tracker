'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const EMPTY: ReadonlySet<string> = new Set()

export interface ExitHold {
  /** Keys currently animating out. The filter pipelines keep these visible. */
  exitingKeys: ReadonlySet<string>
  /** Hold these keys in the filtered list for the length of the exit animation. */
  holdExit: (keys: string[]) => void
}

/**
 * Keeps just-culled cards in the filtered list long enough to animate away.
 *
 * The obtained toggle is optimistic, so a card completed under the "missing"
 * filter used to be dropped from `filteredSets` in the very same commit that
 * started its exit animation — the parent unmounted it before a single frame
 * of the transition could paint. Registering the key here holds it in the list
 * for `holdMs`, so the data still updates instantly (the toggle icon flips, the
 * progress chips move, the write is already in flight) while only the card's
 * disappearance waits for the animation.
 *
 * Expiry is on a timer rather than the transition's `onExited` on purpose:
 * these grids are virtualized, so a row can be scrolled out and unmounted
 * mid-animation. `onExited` would never fire for it and the key would be
 * stranded, leaving an obtained card sitting in the "missing" list until the
 * next reload.
 */
export function useExitHold(holdMs: number): ExitHold {
  const [exitingKeys, setExitingKeys] = useState<ReadonlySet<string>>(EMPTY)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const id of pending) clearTimeout(id)
      pending.clear()
    }
  }, [])

  const holdExit = useCallback(
    (keys: string[]) => {
      if (keys.length === 0) return
      setExitingKeys((prev) => {
        const next = new Set(prev)
        for (const key of keys) next.add(key)
        return next
      })

      const id = setTimeout(() => {
        timers.current.delete(id)
        setExitingKeys((prev) => {
          if (!keys.some((key) => prev.has(key))) return prev
          const next = new Set(prev)
          for (const key of keys) next.delete(key)
          // Collapse back to the shared empty Set so an idle grid keeps a stable
          // identity and the filter memos don't recompute on every hold cycle.
          return next.size === 0 ? EMPTY : next
        })
      }, holdMs)
      timers.current.add(id)
    },
    [holdMs]
  )

  return { exitingKeys, holdExit }
}
