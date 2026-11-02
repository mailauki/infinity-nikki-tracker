// The catalogue routes (/api/outfits, /api/eureka, /api/makeup) return only
// public data — every set, variant and lookup, the same for every viewer — so
// the Vercel CDN can serve them. Per-user obtained state lives on the separate,
// uncached /api/obtained-* routes. Building /api/outfits from the DB takes
// several seconds; a CDN hit takes tens of milliseconds.
//
// Freshness: `max-age` bounds how long the public sees an admin edit late, and
// `stale-while-revalidate` means nobody waits on the slow rebuild once it
// expires. Admins skip the cache entirely (see fetchCatalog), so their own
// edits show on the next load.
const CATALOG_MAX_AGE_S = 300

const CDN_HEADERS = {
  'Vercel-CDN-Cache-Control': `public, max-age=${CATALOG_MAX_AGE_S}, stale-while-revalidate=86400`,
}

// `?fresh=` is the admin cache-buster. Those responses must not be stored, or
// every admin load would leave a one-off entry behind.
export function catalogHeaders(request: Request): HeadersInit | undefined {
  return new URL(request.url).searchParams.has('fresh') ? undefined : CDN_HEADERS
}

export async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

// Client side: one promise per catalogue route, shared across provider mounts.
// Navigating /outfits → /seasons → /outfits remounts the providers (and /seasons
// mounts four at once); without this each mount re-downloaded the catalogue.
// Entries expire with the CDN max-age so a long-lived tab still picks up edits.
//
// Like lib/preferences-cache.ts, every caller gets the SAME resolved object —
// treat it as read-only.
const inFlight = new Map<string, { promise: Promise<unknown>; at: number }>()

export function fetchCatalog<T>(path: string, isAdmin: boolean): Promise<T> {
  if (isAdmin) return fetchJson<T>(`${path}?fresh=${Date.now()}`)

  const hit = inFlight.get(path)
  if (hit && Date.now() - hit.at < CATALOG_MAX_AGE_S * 1000) return hit.promise as Promise<T>

  const promise = fetchJson<T>(path).catch((err) => {
    // Clear on failure so a later mount can retry.
    inFlight.delete(path)
    throw err
  })
  inFlight.set(path, { promise, at: Date.now() })
  return promise
}
