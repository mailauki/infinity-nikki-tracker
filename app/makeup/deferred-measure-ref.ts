import type { Virtualizer } from '@tanstack/react-virtual'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVirtualizer = Virtualizer<any, any>

/**
 * A row `ref` that hands the node to the virtualizer AFTER the commit phase.
 *
 * `virtualizer.measureElement` calls `resizeItem` synchronously, and a row whose
 * real height differs from the estimate reaches `notify(sync = true)` ->
 * `flushSync(rerender)`. React ref callbacks run during the commit, so passing
 * `virtualizer.measureElement` straight to `ref` lands that `flushSync`
 * mid-lifecycle and React throws "flushSync was called from inside a lifecycle
 * method". It surfaces whenever rows mount inside a commit — e.g. `density`
 * hydrating from saved preferences and swapping one grid for another.
 *
 * `useAnimationFrameWithResizeObserver: true` does NOT prevent this. In
 * virtual-core only the ResizeObserver callback is wrapped in
 * `requestAnimationFrame`; the public `measureElement` has no such guard.
 *
 * A microtask is the smallest deferral that leaves the commit phase, and it runs
 * before paint — so rows are still corrected on the same frame and none of them
 * is visibly painted at its estimated height first.
 */
export function deferredMeasureRef(virtualizer: AnyVirtualizer) {
  return (node: HTMLElement | null) => {
    queueMicrotask(() => virtualizer.measureElement(node))
  }
}
