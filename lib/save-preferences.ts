import { invalidatePreferences } from '@/lib/preferences-cache'

// Persist view preferences through the API route rather than a Server Action.
// A Server Action that sets cookies — which the Supabase SSR client does when it
// refreshes a session — marks its response as revalidated, invalidating the
// client router cache. That remounts OutfitDataProvider and refires its ~6.7s
// /api/outfits fetch on every preference toggle. Route handlers cannot trigger
// that revalidation, so the cookie write no longer invalidates anything.
//
// Invalidating the read cache twice — once before the request and once after it
// settles — is deliberate. The pre-write clear drops the stale object so a
// remount during the write does not hydrate from pre-write values; the
// post-settle clear covers the case where that remount's refetch raced ahead of
// the upsert and re-cached a pre-write row. Clearing on failure too is correct:
// a failed write may still have partially applied, and a null cache only costs
// one extra GET.
export function savePreferences(updates: Record<string, unknown>) {
  invalidatePreferences()
  return fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then(
    (r) => {
      invalidatePreferences()
      // 401 is an expected outcome, not a fault: callers gate on a client-side
      // `isLoggedIn` that can outlive the actual session (expired cookie, signed
      // out in another tab). The old Server Action path hit the same condition
      // and returned silently, so surfacing it as a thrown error only produced
      // console noise for a preference that legitimately cannot be saved.
      // Anything else is a real failure and still rejects.
      if (r.status === 401) return
      if (!r.ok) throw new Error(`POST /api/preferences returned ${r.status}`)
    },
    (err) => {
      invalidatePreferences()
      throw err
    }
  )
}
