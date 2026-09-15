import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { SearchResult } from '@/lib/search/types'
import { SEARCH_RESULT_LIMIT } from '@/lib/search/query'

const searchAll = vi.fn()

vi.mock('@/hooks/data/search', () => ({ searchAll: (q: string) => searchAll(q) }))
// The dialog fetches the facet vocabulary on open; this test only cares about
// the footer copy, so every table resolves empty.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: () => ({ select: async () => ({ data: [], error: null }) }) }),
}))

import SearchDialog from '@/components/search/search-dialog'

const rows = (count: number): SearchResult[] =>
  Array.from({ length: count }, (_, i) => ({
    kind: 'outfit_set' as const,
    slug: `s${i}`,
    title: `s${i}`,
    subtitle: null,
    image_url: null,
    parent_slug: null,
    filter_value: null,
    filter_category: null,
    obtained: null,
    rank: 1,
  }))

async function renderWith(count: number) {
  searchAll.mockResolvedValue(rows(count))
  vi.useFakeTimers({ shouldAdvanceTime: true })
  render(<SearchDialog open onClose={() => {}} />)
  // Query is local state with no prop, so the search only runs once something
  // searchable is typed.
  fireEvent.change(screen.getByPlaceholderText(/search outfits/i), { target: { value: 'dream' } })
  // Flushes the debounce timer AND the awaited searchAll resolution inside one
  // act, so the resulting setState lands without an act() warning.
  await act(async () => {
    await vi.runOnlyPendingTimersAsync()
  })
  vi.useRealTimers()
}

describe('SearchDialog footer count', () => {
  beforeEach(() => {
    searchAll.mockReset()
  })

  // At the cap the RPC stopped counting, so the length is a lower bound.
  // "See all 100 results" was a flat lie for a query with 336 real matches.
  it('omits the number when the results hit the cap', async () => {
    await renderWith(SEARCH_RESULT_LIMIT)
    expect(await screen.findByText('See all results')).toBeInTheDocument()
  })

  it('states the exact count below the cap', async () => {
    await renderWith(7)
    expect(await screen.findByText('See all 7 results')).toBeInTheDocument()
  })
})
