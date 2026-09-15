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

  // Regression: a `+` suffix used to be applied to EVERY section whenever the
  // overall result set hit the RPC's cap. Hitting the global cap says nothing
  // about whether this particular kind was truncated, so a section with 5 real
  // matches rendered "5+" -- which, beside a list the modal caps at 5, reads as
  // "more than 5 shown" rather than "more than 5 matched".
  it('states an exact section count even when the results hit the cap', () => {
    const capped = [
      ...Array.from({ length: SEARCH_RESULT_LIMIT - 5 }, (_, i) =>
        result({ kind: 'outfit_set', slug: `s${i}` })
      ),
      ...Array.from({ length: 5 }, (_, i) => result({ kind: 'season', slug: `w${i}` })),
    ]

    render(<SearchResults limitPerKind={5} results={capped} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText('5+')).not.toBeInTheDocument()
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
