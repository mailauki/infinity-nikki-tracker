// Derives the reported-about entity from the URL alone, so the footer report
// link needs no per-page wiring. Unknown shapes yield nulls, which is valid —
// a report without an entity is still a useful report.

// Single-segment detail routes: /<domain>/<slug>
const DETAIL_DOMAINS = ['eureka', 'outfits', 'makeup', 'momo-cloaks', 'looks', 'seasons'] as const

// Nested detail routes: /<domain>/<section>/<slug>, reported as "domain-section"
const NESTED_DETAILS: Record<string, readonly string[]> = {
  eureka: ['trials'],
}

// Second segments that are pages in their own right, not entity slugs.
const NON_ENTITY_SEGMENTS = new Set(['sets', 'trials', 'seasons', 'new', 'edit'])

export function entityFromPath(pathname: string): {
  entity_type: string | null
  entity_slug: string | null
} {
  const none = { entity_type: null, entity_slug: null }

  const segments = pathname.split('?')[0].split('/').filter(Boolean)
  if (segments.length < 2) return none

  const [domain, second, third] = segments

  // Admin routes are never the subject of a user-facing report.
  if (domain === 'admin') return none

  const nested = NESTED_DETAILS[domain]
  if (nested?.includes(second)) {
    return third ? { entity_type: `${domain}-${second}`, entity_slug: third } : none
  }

  if (!(DETAIL_DOMAINS as readonly string[]).includes(domain)) return none
  if (NON_ENTITY_SEGMENTS.has(second)) return none
  if (segments.length > 2) return none

  return { entity_type: domain, entity_slug: second }
}
