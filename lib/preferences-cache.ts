import type { UserPreferences } from '@/lib/types/eureka'

// Three providers mount together on /outfits and each used to fetch preferences
// independently — three identical round-trips on every page load. They share one
// in-flight promise instead. Module scope is correct here: the module is
// per-client-bundle, and preferences are per-session, so there is no cross-user
// leak the way a module-level cache on the server would risk.
//
// Every consumer receives the SAME resolved object, so callers must treat it as
// read-only — mutating it would corrupt the other providers' reads. All current
// callers only read fields off it.
let inFlight: Promise<UserPreferences> | null = null

export function fetchPreferencesOnce(): Promise<UserPreferences> {
  if (inFlight) return inFlight
  inFlight = fetch('/api/preferences')
    .then((r) => {
      if (!r.ok) throw new Error(`/api/preferences returned ${r.status}`)
      return r.json() as Promise<UserPreferences>
    })
    .catch((err) => {
      // Clear on failure so a later mount can retry rather than inheriting a
      // permanently rejected promise.
      inFlight = null
      throw err
    })
  return inFlight
}

// Call after a write so the next read reflects it. Not needed for the current
// callers (they all read once on mount) but required if a consumer ever refetches.
export function invalidatePreferences() {
  inFlight = null
}
