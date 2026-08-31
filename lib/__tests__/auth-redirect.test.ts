import { describe, expect, it } from 'vitest'
import { safeNext } from '../auth-redirect'

describe('safeNext', () => {
  it('accepts a same-site absolute path', () => {
    expect(safeNext('/settings')).toBe('/settings')
    expect(safeNext('/u/someone')).toBe('/u/someone')
  })

  it('accepts a path with a query string', () => {
    expect(safeNext('/settings?tab=account')).toBe('/settings?tab=account')
  })

  // The one that matters: '//evil.com' is protocol-relative, so a browser
  // treats it as an absolute off-site URL despite the leading slash.
  it('rejects a protocol-relative URL', () => {
    expect(safeNext('//evil.com')).toBe('/')
    expect(safeNext('//evil.com/path')).toBe('/')
  })

  it('rejects an absolute URL', () => {
    expect(safeNext('https://evil.com')).toBe('/')
    expect(safeNext('http://evil.com')).toBe('/')
  })

  it('rejects a relative path with no leading slash', () => {
    expect(safeNext('settings')).toBe('/')
  })

  it('falls back to / for null or empty input', () => {
    expect(safeNext(null)).toBe('/')
    expect(safeNext('')).toBe('/')
  })

  // Browsers parse a backslash as equivalent to a forward slash in the
  // authority section (WHATWG URL), so these resolve off-site exactly as
  // '//evil.com' does.
  it('rejects backslash variants of a protocol-relative URL', () => {
    expect(safeNext('/\\evil.com')).toBe('/')
    expect(safeNext('/\\/evil.com')).toBe('/')
    expect(safeNext('/\\\\evil.com')).toBe('/')
    expect(safeNext('\\\\evil.com')).toBe('/')
  })

  // The WHATWG URL parser strips tab, newline, and carriage return before
  // parsing, so these collapse into '//evil.com' and resolve off-site.
  // Verified: new URL('/\t/evil.com', 'https://site').origin === 'https://evil.com'.
  it('rejects control characters that smuggle a protocol-relative prefix', () => {
    expect(safeNext('/\t/evil.com')).toBe('/')
    expect(safeNext('/\n/evil.com')).toBe('/')
    expect(safeNext('/\r/evil.com')).toBe('/')
    expect(safeNext('/\t//evil.com')).toBe('/')
    expect(safeNext('\t//evil.com')).toBe('/')
    expect(safeNext('/\\\t/evil.com')).toBe('/')
  })
})
