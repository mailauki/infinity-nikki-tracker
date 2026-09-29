import type { SortDir } from '@/components/sort-context'

// A collectable's release, resolved. Seasons and trials own the real values;
// every set, piece and cloak carries an optional override. Both halves resolve
// independently, so a piece can override only its version (a x.5 mid-season
// drop) and still inherit its season's date.
export type Release = { released_at: string | null; version: string | null }

export type ReleaseSource =
  | { released_at?: string | null; version?: string | null }
  | null
  | undefined

export const NO_RELEASE: Release = { released_at: null, version: null }

/** First non-null value along the chain, most specific source first. */
export function resolveRelease(...sources: ReleaseSource[]): Release {
  let released_at: string | null = null
  let version: string | null = null
  for (const source of sources) {
    if (!source) continue
    released_at ??= source.released_at ?? null
    version ??= source.version ?? null
  }
  return { released_at, version }
}

/**
 * The release of the earliest dated source, version included — a eureka set
 * dates from the first trial it dropped from. With no dated source, falls back
 * to the first version present so a version-only trial still labels the set.
 */
export function earliestRelease(sources: ReleaseSource[]): Release {
  let best: Release | null = null
  for (const source of sources) {
    if (!source?.released_at) continue
    if (!best || source.released_at < best.released_at!) {
      best = { released_at: source.released_at, version: source.version ?? null }
    }
  }
  if (best) return best
  return { released_at: null, version: sources.find((s) => s?.version)?.version ?? null }
}

/** `1.10` > `1.9`; missing segments count as 0, so `1.5` == `1.5.0`. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.')
  const pb = b.split('.')
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? '0'
    const y = pb[i] ?? '0'
    const nx = Number(x)
    const ny = Number(y)
    const cmp = Number.isNaN(nx) || Number.isNaN(ny) ? x.localeCompare(y) : nx - ny
    if (cmp !== 0) return cmp
  }
  return 0
}

function nullsLast<T>(a: T | null, b: T | null, cmp: (x: T, y: T) => number, dir: SortDir) {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const result = cmp(a, b)
  if (result === 0) return 0
  return dir === 'asc' ? result : -result
}

/**
 * The date axis comparator. Date first, then version, both in `dir`; unknown
 * values sort last whichever way the list runs, so gaps in the data never float
 * to the top. Returns 0 on a full tie — callers append `|| a.id - b.id`.
 */
export function compareRelease(a: Release, b: Release, dir: SortDir): number {
  return (
    nullsLast(a.released_at, b.released_at, (x, y) => (x < y ? -1 : x > y ? 1 : 0), dir) ||
    nullsLast(a.version, b.version, compareVersions, dir)
  )
}

/** A set or cloak row: its own override, then the season the hook embedded. */
export function setRelease(row: {
  released_at?: string | null
  version?: string | null
  season?: ReleaseSource
}): Release {
  return resolveRelease(row, row.season)
}

/** The legacy 'new'/'old' date direction as a SortDir: new = newest first. */
export const orderToDir = (order: 'new' | 'old'): SortDir => (order === 'new' ? 'desc' : 'asc')

/** "v1.5 · Apr 29, 2025", either half alone, or null when nothing is known. */
export function formatRelease({ released_at, version }: Release): string | null {
  const date = released_at
    ? new Date(`${released_at}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null
  const parts = [version ? `v${version}` : null, date].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
