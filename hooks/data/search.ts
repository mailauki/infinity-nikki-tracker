import { createClient } from '@/lib/supabase/client'
import { isSearchableQuery, normalizeQuery } from '@/lib/search/query'
import { SEARCH_KINDS, type SearchKind, type SearchResult } from '@/lib/search/types'

// Client-side: the query changes on every keystroke, so this is deliberately
// NOT React cache()'d. The debounce lives in the dialog, not here.
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!isSearchableQuery(query)) return []

  const supabase = createClient()

  const { data, error } = await supabase.rpc('search_all', { q: normalizeQuery(query) })

  if (error) {
    console.error('search_all failed', error)
    return []
  }

  // Two mismatches between the generated RPC type and reality, neither of which
  // the generator can see:
  //   - `kind` is plain `text` in Postgres, so it widens to string while
  //     SearchKind is a union of 12 literals.
  //   - every RETURNS TABLE column is typed non-nullable, but subtitle,
  //     image_url, parent_slug, filter_value and filter_category are all
  //     genuinely null for most kinds.
  // So map rather than assert: rows whose kind this client does not know about
  // (a newer view against a stale deploy) are dropped instead of reaching
  // destinationFor() as unroutable results, and the nullable columns are
  // normalized to null rather than trusted as strings.
  const known = new Set<string>(SEARCH_KINDS)

  return (data ?? [])
    .filter((row) => known.has(row.kind))
    .map((row) => ({
      kind: row.kind as SearchKind,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle ?? null,
      image_url: row.image_url ?? null,
      parent_slug: row.parent_slug ?? null,
      filter_value: row.filter_value ?? null,
      filter_category: row.filter_category ?? null,
      obtained: row.obtained ?? null,
      rank: row.rank,
    }))
}
