import type { FacetType, SearchFacet } from './types'

export type FacetVocabulary = Record<FacetType, { value: string; label: string }[]>

// Splits a query into facet terms and everything left over.
//
// Whole terms only: a term is claimed when it equals a vocabulary value, never
// when it merely contains one. Substring claiming would let "sweetheart"
// surrender "sweet" and search for "heart".
//
// CALLERS: run this only when the literal whole-query search came back thin.
// Claiming eagerly would break "sweet bloom", which should find the set
// "Sweet Bloom Dreams" rather than splitting into style=sweet + "bloom".
export function claimFacets(
  query: string,
  vocabulary: FacetVocabulary
): { facets: SearchFacet[]; remainder: string } {
  const facets: SearchFacet[] = []
  const unclaimed: string[] = []

  for (const term of query.split(' ').filter(Boolean)) {
    let claimed = false

    for (const type of Object.keys(vocabulary) as FacetType[]) {
      const entry = vocabulary[type].find((candidate) => candidate.value === term)
      if (entry) {
        facets.push({ type, value: entry.value, label: entry.label })
        claimed = true
        break
      }
    }

    if (!claimed) unclaimed.push(term)
  }

  return { facets, remainder: unclaimed.join(' ') }
}
