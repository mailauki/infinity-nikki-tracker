// Persist view preferences through the API route rather than a Server Action.
// A Server Action that sets cookies — which the Supabase SSR client does when it
// refreshes a session — marks its response as revalidated, invalidating the
// client router cache. That remounts OutfitDataProvider and refires its ~6.7s
// /api/outfits fetch on every preference toggle. Route handlers cannot trigger
// that revalidation, so the cookie write no longer invalidates anything.
export function savePreferences(updates: Record<string, unknown>) {
  return fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then((r) => {
    if (!r.ok) throw new Error(`POST /api/preferences returned ${r.status}`)
  })
}
