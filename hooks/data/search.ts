import { createClient } from '@/lib/supabase/client'
import { isSearchableQuery, normalizeQuery } from '@/lib/search/query'
import type { SearchResult } from '@/lib/search/types'

// Client-side: the query changes on every keystroke, so this is deliberately
// NOT React cache()'d. The debounce lives in the dialog, not here.
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!isSearchableQuery(query)) return []

  const supabase = createClient()

  // The search_all RPC is defined in 20260912000000_add_search_index.sql, which
  // is not yet applied, so it is absent from the generated types. Remove this
  // cast after the migration is applied and types are regenerated.
  const rpc = supabase.rpc as unknown as (
    fn: 'search_all',
    args: { q: string }
  ) => Promise<{ data: SearchResult[] | null; error: unknown }>

  const { data, error } = await rpc('search_all', { q: normalizeQuery(query) })

  if (error) {
    console.error('search_all failed', error)
    return []
  }

  return data ?? []
}
