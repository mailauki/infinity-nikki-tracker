import { describe, expect, it } from 'vitest'
import {
  compareRelease,
  compareVersions,
  earliestRelease,
  formatRelease,
  resolveRelease,
  setRelease,
  type Release,
} from '../release'

const r = (released_at: string | null, version: string | null): Release => ({
  released_at,
  version,
})

describe('resolveRelease', () => {
  it('takes the first non-null value along the chain', () => {
    expect(resolveRelease(null, r(null, null), r('2025-04-29', '1.5'))).toEqual(
      r('2025-04-29', '1.5')
    )
  })

  it('resolves date and version independently', () => {
    const piece = { version: '1.5.5', released_at: null }
    const season = r('2025-04-29', '1.5')
    expect(resolveRelease(piece, season)).toEqual(r('2025-04-29', '1.5.5'))
  })

  it('returns nulls when nothing is set', () => {
    expect(resolveRelease(undefined, null)).toEqual(r(null, null))
  })
})

describe('earliestRelease', () => {
  it('picks the earliest dated source and carries its version', () => {
    expect(
      earliestRelease([r('2025-06-01', '1.6'), r('2024-12-05', '1.0'), r(null, '9.9')])
    ).toEqual(r('2024-12-05', '1.0'))
  })

  it('falls back to the first version when no source is dated', () => {
    expect(earliestRelease([r(null, null), r(null, '2.0')])).toEqual(r(null, '2.0'))
  })

  it('is empty for no sources', () => {
    expect(earliestRelease([])).toEqual(r(null, null))
  })
})

describe('compareVersions', () => {
  it('compares numerically, segment by segment', () => {
    expect(compareVersions('1.10', '1.9')).toBeGreaterThan(0)
    expect(compareVersions('2.0', '1.11')).toBeGreaterThan(0)
    expect(compareVersions('1.5', '1.5.0')).toBe(0)
  })
})

describe('compareRelease', () => {
  const sort = (items: Release[], dir: 'asc' | 'desc') =>
    [...items].sort((a, b) => compareRelease(a, b, dir))

  const early = r('2024-12-05', '1.0')
  const late = r('2025-04-29', '1.5')
  const none = r(null, null)

  it('orders by date in the chosen direction', () => {
    expect(sort([early, late], 'desc')).toEqual([late, early])
    expect(sort([late, early], 'asc')).toEqual([early, late])
  })

  it('sorts undated rows last in BOTH directions', () => {
    expect(sort([none, early, late], 'desc').at(-1)).toBe(none)
    expect(sort([none, early, late], 'asc').at(-1)).toBe(none)
  })

  it('breaks a same-day tie on version, numerically', () => {
    const a = r('2025-04-29', '1.9')
    const b = r('2025-04-29', '1.10')
    expect(sort([a, b], 'desc')).toEqual([b, a])
  })

  it('returns 0 for identical releases so the caller can tie-break on id', () => {
    expect(compareRelease(late, r('2025-04-29', '1.5'), 'desc')).toBe(0)
  })
})

describe('setRelease', () => {
  it('prefers the row override, then its embedded season', () => {
    expect(
      setRelease({ released_at: null, version: '1.5.5', season: r('2025-04-29', '1.5') })
    ).toEqual(r('2025-04-29', '1.5.5'))
  })
  it('handles a row with no season', () => {
    expect(setRelease({ released_at: null, version: null, season: null })).toEqual(r(null, null))
  })
})

describe('formatRelease', () => {
  it('formats version and date', () => {
    expect(formatRelease(r('2025-04-29', '1.5'))).toBe('v1.5 · Apr 29, 2025')
  })
  it('formats either half alone', () => {
    expect(formatRelease(r(null, '1.5'))).toBe('v1.5')
    expect(formatRelease(r('2025-04-29', null))).toBe('Apr 29, 2025')
  })
  it('is null when empty', () => {
    expect(formatRelease(r(null, null))).toBeNull()
  })
})
