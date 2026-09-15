import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchResults from '@/components/search/search-results'
import { SEARCH_RESULT_LIMIT } from '@/lib/search/query'
import type { SearchResult } from '@/lib/search/types'

const result = (
  over: Partial<SearchResult> & Pick<SearchResult, 'kind' | 'slug'>
): SearchResult => ({
  title: over.slug,
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  filter_category: null,
  obtained: null,
  rank: 1,
  ...over,
})

describe('SearchResults', () => {
  it('groups results under a header per kind', () => {
    render(
      <SearchResults
        results={[
          result({ kind: 'outfit_set', slug: 'moon' }),
          result({ kind: 'season', slug: 'winter' }),
        ]}
      />
    )
    expect(screen.getByText('Outfits')).toBeInTheDocument()
    expect(screen.getByText('Seasons')).toBeInTheDocument()
  })

  it('caps each section at limitPerKind and shows the true total', () => {
    render(
      <SearchResults
        limitPerKind={2}
        results={[
          result({ kind: 'outfit_set', slug: 'a' }),
          result({ kind: 'outfit_set', slug: 'b' }),
          result({ kind: 'outfit_set', slug: 'c' }),
        ]}
      />
    )
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.queryByText('c')).not.toBeInTheDocument()
    // The header still reports 3 so the cap never hides how much matched.
    expect(screen.getByText('Outfits')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  // A result set at the RPC's cap is truncated, so no section count in it is a
  // total. `100+` is the honest rendering; a bare `100` is provably wrong for
  // any query with more matches (e.g. "dream", which has 336).
  it('marks section counts as a lower bound when the results hit the cap', () => {
    render(
      <SearchResults
        results={Array.from({ length: SEARCH_RESULT_LIMIT }, (_, i) =>
          result({ kind: 'outfit_set', slug: `s${i}` })
        )}
      />
    )
    expect(screen.getByText(`${SEARCH_RESULT_LIMIT}+`)).toBeInTheDocument()
    expect(screen.queryByText(String(SEARCH_RESULT_LIMIT))).not.toBeInTheDocument()
  })

  it('states an exact section count below the cap', () => {
    render(
      <SearchResults
        results={Array.from({ length: SEARCH_RESULT_LIMIT - 1 }, (_, i) =>
          result({ kind: 'outfit_set', slug: `s${i}` })
        )}
      />
    )
    expect(screen.getByText(String(SEARCH_RESULT_LIMIT - 1))).toBeInTheDocument()
    expect(screen.queryByText(`${SEARCH_RESULT_LIMIT - 1}+`)).not.toBeInTheDocument()
  })

  it('renders an empty state when there are no results', () => {
    render(<SearchResults results={[]} />)
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  it('links each result to its destination', () => {
    render(<SearchResults results={[result({ kind: 'outfit_set', slug: 'moon' })]} />)
    expect(screen.getByRole('link', { name: /moon/ })).toHaveAttribute('href', '/outfits/moon')
  })
})
