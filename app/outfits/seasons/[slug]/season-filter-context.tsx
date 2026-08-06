'use client'

import { createContext, useContext, useState } from 'react'

interface SeasonFilterContextValue {
  hideEvolutions: boolean
  hideGlowups: boolean
  // Standalone pieces are individually-authored variants rather than sets, and a
  // season can hold far more of them than sets (129 vs 130 on the launch season),
  // so they get their own toggle. Makeup sets are unaffected — they are sets.
  hidePieces: boolean
  // Makeup sets are a separate collection domain that shares a season, so they
  // get their own toggle rather than riding along with the pieces one.
  hideMakeup: boolean
  onHideEvolutionsChange: () => void
  onHideGlowupsChange: () => void
  onHidePiecesChange: () => void
  onHideMakeupChange: () => void
}

const SeasonFilterContext = createContext<SeasonFilterContextValue | null>(null)

export function SeasonFilterProvider({ children }: { children: React.ReactNode }) {
  const [hideEvolutions, setHideEvolutions] = useState(false)
  const [hideGlowups, setHideGlowups] = useState(false)
  const [hidePieces, setHidePieces] = useState(false)
  const [hideMakeup, setHideMakeup] = useState(false)

  return (
    <SeasonFilterContext.Provider
      value={{
        hideEvolutions,
        hideGlowups,
        hidePieces,
        hideMakeup,
        onHideEvolutionsChange: () => setHideEvolutions((v) => !v),
        onHideGlowupsChange: () => setHideGlowups((v) => !v),
        onHidePiecesChange: () => setHidePieces((v) => !v),
        onHideMakeupChange: () => setHideMakeup((v) => !v),
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
