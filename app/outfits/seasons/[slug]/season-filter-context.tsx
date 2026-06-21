'use client'

import { createContext, useContext, useState } from 'react'

interface SeasonFilterContextValue {
  hideEvolutions: boolean
  hideGlowups: boolean
  onHideEvolutionsChange: () => void
  onHideGlowupsChange: () => void
}

const SeasonFilterContext = createContext<SeasonFilterContextValue | null>(null)

export function SeasonFilterProvider({ children }: { children: React.ReactNode }) {
  const [hideEvolutions, setHideEvolutions] = useState(false)
  const [hideGlowups, setHideGlowups] = useState(false)

  return (
    <SeasonFilterContext.Provider
      value={{
        hideEvolutions,
        hideGlowups,
        onHideEvolutionsChange: () => setHideEvolutions((v) => !v),
        onHideGlowupsChange: () => setHideGlowups((v) => !v),
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
