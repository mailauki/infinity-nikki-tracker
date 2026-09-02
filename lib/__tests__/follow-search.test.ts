import { describe, expect, it } from 'vitest'
import { buildProfileSearchFilter, escapeFilterValue } from '@/lib/follow-search'

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
})

describe('buildProfileSearchFilter', () => {
  it('matches the query against both username and display_name', () => {
    expect(buildProfileSearchFilter('nik')).toBe('username.ilike.%nik%,display_name.ilike.%nik%')
  })

  it('uses the escaped query, not the raw one', () => {
    expect(buildProfileSearchFilter('a,b')).toBe('username.ilike.%ab%,display_name.ilike.%ab%')
  })
})
