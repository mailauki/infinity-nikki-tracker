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
  //
  // The cast is applied to the CALL, never by extracting `supabase.rpc` into a
  // local: `const rpc = supabase.rpc` detaches the method from its receiver, so
  // `this` is undefined inside it and the call dies with "Cannot read
  // properties of undefined (reading 'rest')" before any request is made.
  const { data, error } = (await (
    supabase.rpc as unknown as (
      fn: 'search_all',
      args: { q: string }
    ) => Promise<{ data: SearchResult[] | null; error: unknown }>
  ).call(supabase, 'search_all', { q: normalizeQuery(query) })) as {
    data: SearchResult[] | null
    error: unknown
  }

  if (error) {
    console.error('search_all failed', error)
    return []
  }

  return data ?? []
}
