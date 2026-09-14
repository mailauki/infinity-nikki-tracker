import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchResults from '@/components/search/search-results'
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

  it('renders an empty state when there are no results', () => {
    render(<SearchResults results={[]} />)
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  it('links each result to its destination', () => {
    render(<SearchResults results={[result({ kind: 'outfit_set', slug: 'moon' })]} />)
    expect(screen.getByRole('link', { name: /moon/ })).toHaveAttribute('href', '/outfits/moon')
  })
})
