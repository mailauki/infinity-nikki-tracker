import { describe, expect, it } from 'vitest'
import { buildProfileSearchFilter, escapeFilterValue, isSearchable } from '@/lib/follow-search'

describe('escapeFilterValue', () => {
  it('passes an ordinary query through unchanged', () => {
    expect(escapeFilterValue('nikki')).toBe('nikki')
  })

  // `,` separates the clauses of an .or() filter. Left raw, a query containing
  // one injects an extra clause and changes which rows match.
  it('strips commas that would split the or() clause list', () => {
    expect(escapeFilterValue('a,b')).toBe('ab')
  })

  // `.` separates column.operator.value inside a clause.
  it('strips periods that would split column from operator', () => {
    expect(escapeFilterValue('a.b')).toBe('ab')
  })

  // `%` is the ilike wildcard — a bare one matches every row.
  it('strips percent signs so a query cannot become a wildcard', () => {
    expect(escapeFilterValue('%')).toBe('')
  })

  it('strips parentheses that would nest a filter group', () => {
    expect(escapeFilterValue('a(b)c')).toBe('abc')
  })

  // `*` is PostgREST's alias for `%` in ilike filter values — a bare one
  // matches every row exactly like a bare `%` does.
  it('strips asterisks so a query cannot become a wildcard alias', () => {
    expect(escapeFilterValue('*')).toBe('')
  })

  // `_` is SQL LIKE's single-character wildcard — left in, "q_okka" matches
  // "quokka" even though the user never typed a "u".
  it('strips underscores so a query cannot use the single-char wildcard', () => {
    expect(escapeFilterValue('_')).toBe('')
  })

  it('strips underscores out of an otherwise literal query', () => {
    expect(escapeFilterValue('q_okka')).toBe('qokka')
  })
})

describe('buildProfileSearchFilter', () => {
  it('matches the query against both username and display_name', () => {
    expect(buildProfileSearchFilter('nik')).toBe('username.ilike.%nik%,display_name.ilike.%nik%')
  })

  it('uses the escaped query, not the raw one', () => {
    expect(buildProfileSearchFilter('a,b')).toBe('username.ilike.%ab%,display_name.ilike.%ab%')
  })

  // The threat model: no matter what a caller passes in, the input can only
  // change the search TERM, never the filter's STRUCTURE (clause count,
  // column names, operators). Assert that structural shape directly across
  // a battery of adversarial inputs, rather than re-deriving the regex.
  it.each(['a,b', 'a.b', '%', '*', '_', 'a(b)c', 'x,y.z%*_'])(
    'never changes the filter structure for adversarial input %j',
    (input) => {
      const filter = buildProfileSearchFilter(input)
      expect(filter.startsWith('username.ilike.%')).toBe(true)
      expect(filter.split(',').length).toBe(2)
      expect((filter.match(/,/g) ?? []).length).toBe(1)
      expect(filter.includes(',display_name.ilike.%')).toBe(true)
    }
  )
})

describe('isSearchable', () => {
  it.each(['', '   ', '%', '*', '___', '...'])(
    'returns false for %j, which would reduce to an empty term',
    (input) => {
      expect(isSearchable(input)).toBe(false)
    }
  )

  it.each(['nikki', 'a_b'])('returns true for %j, which is non-empty after stripping', (input) => {
    expect(isSearchable(input)).toBe(true)
  })
})
