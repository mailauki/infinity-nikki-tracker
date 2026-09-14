import { describe, expect, it } from 'vitest'
import { MIN_QUERY_LENGTH, isSearchableQuery, normalizeQuery } from '@/lib/search/query'

describe('normalizeQuery', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeQuery('  Moon   Iridescent ')).toBe('moon iridescent')
  })

  // Reuses follow-search's escaper: `%` is an ilike wildcard, and a bare one
  // would match every row rather than narrowing anything.
  it('strips wildcard characters', () => {
    expect(normalizeQuery('%moon%')).toBe('moon')
  })
})

describe('isSearchableQuery', () => {
  it('rejects a query shorter than the minimum', () => {
    expect(isSearchableQuery('a')).toBe(false)
  })

  it('accepts a query at the minimum length', () => {
    expect(isSearchableQuery('ab')).toBe(true)
    expect(MIN_QUERY_LENGTH).toBe(2)
  })

  // The case that matters: punctuation-only input escapes down to nothing.
  // Without this guard it would reach the RPC as '' and match everything.
  it('rejects a query that is empty after escaping', () => {
    expect(isSearchableQuery('%%%')).toBe(false)
  })
})
