export const SEARCH_KINDS = [
  'outfit_set',
  'outfit_evolution',
  'outfit_piece',
  'eureka_set',
  'eureka_variant',
  'makeup_set',
  'makeup_variant',
  'momo_cloak',
  'season',
  'trial',
  'custom_look',
  'profile',
] as const

export type SearchKind = (typeof SEARCH_KINDS)[number]

// Section headers in the grouped results, in display order (SEARCH_KINDS order).
export const KIND_LABELS: Record<SearchKind, string> = {
  outfit_set: 'Outfits',
  outfit_evolution: 'Evolutions',
  outfit_piece: 'Outfit Pieces',
  eureka_set: 'Eureka',
  eureka_variant: 'Eureka Variants',
  makeup_set: 'Makeup',
  makeup_variant: 'Makeup Pieces',
  momo_cloak: 'Momo Cloaks',
  season: 'Seasons',
  trial: 'Trials',
  custom_look: 'Custom Looks',
  profile: 'Players',
}

export type SearchResult = {
  kind: SearchKind
  slug: string
  title: string
  subtitle: string | null
  image_url: string | null
  parent_slug: string | null
  // The filter value a result carries to its destination, when its own slug
  // is not that value. Eureka variants need it: the slug is
  // `{set}-{category}-{color}` but the detail page's ?color= validates
  // against bare color slugs. Null for every other kind.
  filter_value: string | null
  // The bare category slug a toggle must key on, when the row's `subtitle` is
  // NOT that category. Only eureka variants set it (head/hands/feet): their
  // subtitle is the parent set title ("Masked Magic"), and passing that as the
  // category writes junk rows into obtained_eureka. Null for every other kind,
  // where the subtitle already IS the category.
  filter_category: string | null
  // Collection state for the four collectible kinds, resolved by the RPC for
  // the rows on screen only. Null for non-collectible kinds (seasons, trials,
  // profiles). False -- not null -- for signed-out viewers: the RPC's EXISTS
  // clauses are scoped to auth.uid(), which is null when signed out.
  obtained: boolean | null
  rank: number
}

// A closed-vocabulary attribute claimed out of the query (see lib/search/facets.ts).
export type FacetType = 'style' | 'label' | 'ability' | 'location' | 'color' | 'category'

export type SearchFacet = {
  type: FacetType
  value: string
  label: string
}
