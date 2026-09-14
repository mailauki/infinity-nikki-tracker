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

// Returns null when a result has no reachable page. Callers MUST render such
// a row as non-navigating rather than linking to null.
export function destinationFor(result: SearchResult, facets: SearchFacet[] = []): string | null {
  const { kind, slug, parent_slug, filter_value } = result

  switch (kind) {
    case 'outfit_set':
      return withFacets(`/outfits/${slug}`, kind, facets)
    // Neither evolutions nor pieces have a page; both resolve to the parent
    // set and highlight themselves with the ?evolution= param it already reads.
    case 'outfit_evolution':
    case 'outfit_piece':
      return parent_slug ? `/outfits/${parent_slug}?evolution=${slug}` : null
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
    case 'makeup_variant':
      return parent_slug ? `/makeup/${parent_slug}?evolution=${slug}` : null
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
