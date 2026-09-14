import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ObtainedToggle from '@/components/search/obtained-toggle'
import type { SearchResult } from '@/lib/search/types'

vi.mock('@/app/eureka/actions', () => ({ handleObtained: vi.fn(() => Promise.resolve()) }))
vi.mock('@/app/outfits/actions', () => ({ handleObtainedOutfit: vi.fn(() => Promise.resolve()) }))
vi.mock('@/app/makeup/actions', () => ({ handleObtainedMakeup: vi.fn(() => Promise.resolve()) }))
vi.mock('@/app/momo-cloaks/actions', () => ({
  handleObtainedMomoCloak: vi.fn(() => Promise.resolve()),
}))
vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const base: SearchResult = {
  kind: 'momo_cloak',
  slug: 'cozy',
  title: 'Cozy Cloak',
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  obtained: false,
  rank: 1,
}

describe('ObtainedToggle', () => {
  it('renders nothing for a non-collectible kind', () => {
    const { container } = render(<ObtainedToggle result={{ ...base, kind: 'season' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when obtained is null (signed out)', () => {
    const { container } = render(<ObtainedToggle result={{ ...base, obtained: null }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('reflects false as an outline icon, not pressed', () => {
    render(<ObtainedToggle result={{ ...base, obtained: false }} />)
    const button = screen.getByRole('button', { name: /mark cozy cloak as obtained/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  // Regression: search-results.tsx keys rows as `${kind}-${slug}`, which is
  // stable across a re-search, so React reuses this same component instance.
  // Local state must not shadow a fresh result.obtained from new props.
  it('picks up a new result.obtained on rerender instead of keeping stale local state', () => {
    const { rerender } = render(<ObtainedToggle result={{ ...base, obtained: false }} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')

    // Same row (same kind+slug identity), but the server now reports it
    // obtained -- e.g. toggled in another tab, or a refined query returning
    // the same result with fresh data.
    rerender(<ObtainedToggle result={{ ...base, obtained: true }} />)

    const button = screen.getByRole('button', { name: /mark cozy cloak as not obtained/i })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
