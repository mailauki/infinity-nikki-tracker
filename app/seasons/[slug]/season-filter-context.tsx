'use client'

import { createContext, useContext, useState } from 'react'

interface SeasonFilterContextValue {
  // The base state of every set (outfit and makeup) — the set as first obtained,
  // before any evolution.
  hideBaseSets: boolean
  hideEvolutions: boolean
  hideGlowups: boolean
  // Standalone pieces are individually-authored variants rather than sets, and a
  // season can hold far more of them than sets (129 vs 130 on the launch season),
  // so they get their own toggle. Makeup sets are unaffected — they are sets.
  hidePieces: boolean
  // Makeup sets are a separate collection domain that shares a season, so they
  // get their own toggle rather than riding along with the pieces one.
  hideMakeup: boolean
  onHideBaseSetsChange: () => void
  onHideEvolutionsChange: () => void
  onHideGlowupsChange: () => void
  onHidePiecesChange: () => void
  onHideMakeupChange: () => void
  // Shows or hides every kind at once. Together the five flags cover everything a
  // season can display, so "show all" genuinely means all.
  onSetAllVisible: (visible: boolean) => void
}

const SeasonFilterContext = createContext<SeasonFilterContextValue | null>(null)

export function SeasonFilterProvider({ children }: { children: React.ReactNode }) {
  const [hideBaseSets, setHideBaseSets] = useState(false)
  // Evolutions and glow-ups start hidden. A season page answers "what does this
  // season contain", and an evolution is another state of a set the season
  // already lists rather than another thing to collect — so counting them by
  // default inflated every category against what the season actually offers.
  // Both toggles are still there for anyone who wants the full set graph.
  const [hideEvolutions, setHideEvolutions] = useState(true)
  const [hideGlowups, setHideGlowups] = useState(true)
  const [hidePieces, setHidePieces] = useState(false)
  const [hideMakeup, setHideMakeup] = useState(false)

  // `visible` is the user-facing sense, so hiding everything means setting every
  // hide-flag true.
  const setAllVisible = (visible: boolean) => {
    const hidden = !visible
    setHideBaseSets(hidden)
    setHideEvolutions(hidden)
    setHideGlowups(hidden)
    setHidePieces(hidden)
    setHideMakeup(hidden)
  }

  return (
    <SeasonFilterContext.Provider
      value={{
        hideBaseSets,
        hideEvolutions,
        hideGlowups,
        hidePieces,
        hideMakeup,
        onHideBaseSetsChange: () => setHideBaseSets((v) => !v),
        onHideEvolutionsChange: () => setHideEvolutions((v) => !v),
        onHideGlowupsChange: () => setHideGlowups((v) => !v),
        onHidePiecesChange: () => setHidePieces((v) => !v),
        onHideMakeupChange: () => setHideMakeup((v) => !v),
        onSetAllVisible: setAllVisible,
      }}
    >
      {children}
    </SeasonFilterContext.Provider>
  )
}

export function useSeasonFilter() {
  const ctx = useContext(SeasonFilterContext)
  if (!ctx) throw new Error('useSeasonFilter must be used within SeasonFilterProvider')
  return ctx
}

// Non-throwing variant for shared components (e.g. SlugToolBar) that render on
// many slug pages but only show the season toggles when wrapped in the provider.
export function useSeasonFilterOptional() {
  return useContext(SeasonFilterContext)
}
