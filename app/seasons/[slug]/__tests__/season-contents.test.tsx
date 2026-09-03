import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import SeasonContents from '../season-contents'
import { DrawerStateProvider, useSidebar } from '@/components/navbar/navbar-toolbar-context'

vi.mock('@/components/outfits/outfit-context', () => ({
  useOutfitData: () => ({ obtainedOutfit: [] }),
}))

vi.mock('@/components/makeup/makeup-context', () => ({
  useMakeupData: () => ({ obtainedMakeup: [] }),
}))

vi.mock('../season-filter-context', () => ({
  useSeasonFilter: () => ({
    hideEvolutions: false,
    hideGlowups: false,
    hidePieces: false,
    hideMakeup: false,
    hideBaseSets: false,
    filters: { obtained: null, rarity: null, styles: [] },
  }),
}))

// Reads activePanel back out so assertions don't depend on SeasonContents'
// panelId-gated body actually portaling — the portal target is null in this
// test (no LayoutShell), so the only observable effect of the mount-time
// default is the context value itself.
function ActivePanelProbe() {
  const { activePanel } = useSidebar()
  return <span data-testid="active-panel">{String(activePanel)}</span>
}

const baseProps = {
  seasonSets: [],
  standaloneVariants: [],
  makeupSets: [],
  seasonSlug: 'exploration_season',
  seasonCategories: [],
  seasonGroups: [],
  isLoggedIn: false,
}

describe('SeasonContents', () => {
  // Regression for Finding 1: navigating to a season page with the sidebar
  // already open (persisted from another route) used to leave activePanel
  // null, so neither panelId'd SidebarBody would portal — an open, empty
  // drawer until the user clicked Contents or Filters. SeasonContents now
  // claims "contents" on mount whenever nothing has claimed a panel yet.
  it('defaults activePanel to "contents" on mount when nothing is active', () => {
    render(
      <DrawerStateProvider>
        <ActivePanelProbe />
        <SeasonContents {...baseProps} />
      </DrawerStateProvider>
    )

    expect(screen.getByTestId('active-panel')).toHaveTextContent('contents')
  })

  // Must not fight an explicit choice: if the filter panel (or some other
  // panel) already claimed activePanel BEFORE SeasonContents mounts — e.g. the
  // user clicked Filters, which is still the live state when they navigate to
  // a fresh season page — SeasonContents must leave it alone rather than
  // stealing focus back to "contents". Modeled with a toggleable wrapper so
  // activePanel is already 'filters' by the time SeasonContents first mounts,
  // matching how the real bug (and fix) plays out across a navigation.
  function ActivePanelSetterThenContents() {
    const { setActivePanel } = useSidebar()
    const [mountContents, setMountContents] = useState(false)
    return (
      <>
        <button
          onClick={() => {
            setActivePanel('filters')
            setMountContents(true)
          }}
        >
          claim filters
        </button>
        {mountContents && <SeasonContents {...baseProps} />}
      </>
    )
  }

  it('does not override an already-active panel', () => {
    render(
      <DrawerStateProvider>
        <ActivePanelProbe />
        <ActivePanelSetterThenContents />
      </DrawerStateProvider>
    )

    act(() => screen.getByText('claim filters').click())

    expect(screen.getByTestId('active-panel')).toHaveTextContent('filters')
  })
})
