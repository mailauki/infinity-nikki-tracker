import { describe, expect, it } from 'vitest'
import { readReleaseFields } from '../release-form'

const fd = (entries: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(entries)) data.set(k, v)
  return data
}

describe('readReleaseFields', () => {
  it('reads a date and a trimmed version', () => {
    expect(readReleaseFields(fd({ released_at: '2025-04-29', version: ' 1.5 ' }))).toEqual({
      released_at: '2025-04-29',
      version: '1.5',
    })
  })

  it('stores blanks as null so the row inherits', () => {
    expect(readReleaseFields(fd({ released_at: '', version: '  ' }))).toEqual({
      released_at: null,
      version: null,
    })
  })

  it('rejects a malformed date rather than sending it to Postgres', () => {
    expect(readReleaseFields(fd({ released_at: '29/04/2025' })).released_at).toBeNull()
  })

  it('treats absent keys as null', () => {
    expect(readReleaseFields(new FormData())).toEqual({ released_at: null, version: null })
  })
})
