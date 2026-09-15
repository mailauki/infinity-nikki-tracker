import { escapeFilterValue } from '@/lib/follow-search'

// Two characters is the shortest query worth a round-trip: a single letter
// matches a large fraction of a 9,200-row corpus and tells the user nothing.
export const MIN_QUERY_LENGTH = 2

// Lowercase, collapse runs of whitespace, and strip the wildcard/structural
// characters escapeFilterValue handles. Accent folding is NOT done here --
// Postgres does it via unaccent_fallback() so the query and the indexed
// haystack are folded by exactly the same code.
export function normalizeQuery(raw: string): string {
  return escapeFilterValue(raw).toLowerCase().trim().replace(/\s+/g, ' ')
}

export function isSearchableQuery(raw: string): boolean {
  return normalizeQuery(raw).length >= MIN_QUERY_LENGTH
}

// Mirrors the `limit 100` at the end of search_all() in
// supabase/migrations/20260912000000_add_search_index.sql. A result set of
// exactly this length is a CAP, not a total -- the UI must not state it as an
// exact count. Change both together.
export const SEARCH_RESULT_LIMIT = 100
