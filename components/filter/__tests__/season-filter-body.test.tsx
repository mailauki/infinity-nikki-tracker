import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import SeasonFilterBody from '../season-filter-body'
import { SeasonFilterProvider } from '@/app/seasons/[slug]/season-filter-context'

vi.mock('@/lib/save-preferences', () => ({ savePreferences: () => Promise.resolve() }))

vi.mock('@/components/outfits/outfit-context', () => ({
  useOutfitData: () => ({ styles: [] }),
}))

const setSidebarOpen = vi.fn()
vi.mock('@/components/navbar/navbar-toolbar-context', () => ({
  useSidebar: () => ({ setSidebarOpen }),
}))

function renderBody() {
  return render(
    <SeasonFilterProvider isLoggedIn={false}>
      <SeasonFilterBody />
    </SeasonFilterProvider>
  )
}

describe('SeasonFilterBody', () => {
  it('does not offer Clear all when nothing is active', () => {
    renderBody()
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
  })

  // Regression: hasActiveFilters (context) also covers the five visibility
  // toggles and density, but onClearFilters only resets the three filter axes
  // (obtained/rarity/styles). Gating "Clear all" on the wider flag let it
  // appear from a visibility-only change and then no-op on click. "Clear all"
  // must be gated on the same filter-axes state that onClearFilters actually
  // resets.
  it('does not show Clear all when only a visibility toggle changed', () => {
    renderBody()

    act(() => screen.getByRole('checkbox', { name: 'Show Evolutions' }).click())

    // The visibility toggle did take effect...
    expect(screen.getByRole('checkbox', { name: 'Show Evolutions' })).toBeChecked()
    // ...but Clear all only clears filter axes, so it must not appear here —
    // a visible Clear all with nothing for it to clear would be a no-op button.
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    // Reset is the correct affordance for a visibility-only change.
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('shows Clear all once a filter axis is set, and clicking it clears the axis', () => {
    renderBody()

    act(() => screen.getByRole('button', { name: '5' }).click())

    const clearAll = screen.getByRole('button', { name: 'Clear all' })
    expect(clearAll).toBeInTheDocument()

    act(() => clearAll.click())

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
  })
})
