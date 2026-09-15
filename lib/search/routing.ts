import type { SearchFacet, SearchKind, SearchResult } from './types'

// Which facet types each destination can actually act on. A facet not listed
// here is dropped rather than appended -- the page would ignore an unknown
// param anyway, and a dead param in a shared URL is just noise.
const FACETS_BY_KIND: Partial<Record<SearchKind, SearchFacet['type'][]>> = {
  eureka_set: ['color', 'category'],
  eureka_variant: ['color', 'category'],
}

function withFacets(path: string, kind: SearchKind, facets: SearchFacet[]): string {
  const allowed = FACETS_BY_KIND[kind] ?? []
  const params = new URLSearchParams()
  for (const facet of facets) {
    if (allowed.includes(facet.type)) params.set(facet.type, facet.value)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

// An outfit evolution's slug is `{base_set}-{suffix}`, and the set page wants
// only the suffix. Returns '' -- no param at all -- when the slug does not
// carry the parent prefix, so an unexpected shape lands on the plain set page
// rather than seeding a reconstructed slug that matches nothing.
function evolutionSuffix(slug: string, parent_slug: string): string {
  const prefix = `${parent_slug}-`
  if (!slug.startsWith(prefix)) return ''
  const suffix = slug.slice(prefix.length)
  return suffix ? `?evolution=${encodeURIComponent(suffix)}` : ''
}

// Returns null when a result has no reachable page. Callers MUST render such
// a row as non-navigating rather than linking to null.
export function destinationFor(result: SearchResult, facets: SearchFacet[] = []): string | null {
  const { kind, slug, parent_slug, filter_value } = result

  switch (kind) {
    case 'outfit_set':
      return withFacets(`/outfits/${slug}`, kind, facets)
    // NOT `slug` -- outfit-set-detail.tsx reads ?evolution= as a SUFFIX and
    // rebuilds `{set}-{param}`, so passing the whole slug would resolve to
    // `moon-moon-expedition` and select nothing.
    case 'outfit_evolution':
      return parent_slug ? `/outfits/${parent_slug}${evolutionSuffix(slug, parent_slug)}` : null
    // No param: an outfit piece is a VARIANT (`{set}-{category}`), not an
    // evolution state, and ?evolution= is the only param the set page reads.
    // There is no piece-highlighting param yet -- add one to the detail page
    // before routing to one here; a dead param is worse than none.
    case 'outfit_piece':
      return parent_slug ? `/outfits/${parent_slug}` : null
    case 'eureka_set':
      return withFacets(`/eureka/${slug}`, kind, facets)
    // NOT `slug` -- a eureka variant slug is `{set}-{category}-{color}`
    // (e.g. `innocent_slumber-head-blue`), while the detail page validates
    // ?color= against its own color slugs (`blue`) and silently ignores
    // anything else. The bare color column is the only value that filters.
    case 'eureka_variant':
      return parent_slug && filter_value ? `/eureka/${parent_slug}?color=${filter_value}` : null
    case 'makeup_set':
      return withFacets(`/makeup/${slug}`, kind, facets)
    // Same reasoning as outfit_piece. makeup-set-detail.tsx passes ?evolution=
    // through whole (makeup evolution slugs are opaque, not `{base}-{suffix}`),
    // but a makeup variant slug is a VARIANT and never names an evolution, so
    // the param would select nothing. Parent set, no param.
    case 'makeup_variant':
      return parent_slug ? `/makeup/${parent_slug}` : null
    case 'momo_cloak':
      return `/momo-cloaks/${slug}`
    case 'season':
      return `/seasons/${slug}`
    case 'trial':
      return `/eureka/trials/${slug}`
    case 'custom_look':
      return `/looks/${slug}`
    case 'profile':
      return `/u/${slug}`
  }
}
