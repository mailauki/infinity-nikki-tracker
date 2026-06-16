'use client'

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { updateOutfitDensity, updateOutfitImageMode } from '@/app/actions/preferences'

// The image swap cycles between main image and alternate image.
export type OutfitImageMode = 'image' | 'alt'

// Cycle order; `image` (the main image) is the default starting mode.
export const OUTFIT_IMAGE_MODES: OutfitImageMode[] = ['image', 'alt']

// Card layout density for the outfits grid. `list` is planned but not yet
// implemented.
export type OutfitDensity = 'standard' | 'compact'

// Resolve which image to show for the current mode, falling back to the main
// image when the requested source is missing.
export function resolveOutfitImage(
  mode: OutfitImageMode,
  sources: { image?: string | null; alt?: string | null }
): string | null | undefined {
  const { image, alt } = sources
  if (mode === 'alt') return alt || image
  return image
}

type OutfitImageModeContextValue = {
  mode: OutfitImageMode
  setMode: (mode: OutfitImageMode) => void
  cycleMode: () => void
  density: OutfitDensity
  setDensity: (density: OutfitDensity) => void
  reset: () => void
}

// Defaults make the hook safe outside a provider (e.g. nested cards), where no
// provider is mounted.
const OutfitImageModeContext = createContext<OutfitImageModeContextValue>({
  mode: 'image',
  setMode: () => {},
  cycleMode: () => {},
  density: 'standard',
  setDensity: () => {},
  reset: () => {},
})

export function OutfitImageModeProvider({
  isLoggedIn = false,
  children,
}: {
  isLoggedIn?: boolean
  children: React.ReactNode
}) {
  const [mode, setModeState] = useState<OutfitImageMode>('image')
  const [density, setDensityState] = useState<OutfitDensity>('standard')
  const [, startTransition] = useTransition()

  // Hydrate from saved preferences for logged-in users.
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/preferences')
      .then((r) => (r.ok ? (r.json() as Promise<UserPreferences>) : null))
      .then((prefs) => {
        if (!prefs) return
        if (prefs.outfit_image_mode) setModeState(prefs.outfit_image_mode as OutfitImageMode)
        if (prefs.outfit_density) setDensityState(prefs.outfit_density as OutfitDensity)
      })
      .catch(() => {})
  }, [isLoggedIn])

  const setMode = (next: OutfitImageMode) => {
    setModeState(next)
    if (isLoggedIn) startTransition(() => updateOutfitImageMode(next))
  }

  const setDensity = (next: OutfitDensity) => {
    setDensityState(next)
    if (isLoggedIn) startTransition(() => updateOutfitDensity(next))
  }

  // Restore both image mode and density to their defaults ('image' / 'standard'),
  // persisting the reset for logged-in users. Used by the filter menu "Clear all".
  const reset = () => {
    setModeState('image')
    setDensityState('standard')
    if (isLoggedIn) {
      startTransition(() => {
        updateOutfitImageMode('image')
        updateOutfitDensity('standard')
      })
    }
  }

  const value = useMemo<OutfitImageModeContextValue>(
    () => ({
      mode,
      setMode,
      cycleMode: () => {
        const next =
          OUTFIT_IMAGE_MODES[(OUTFIT_IMAGE_MODES.indexOf(mode) + 1) % OUTFIT_IMAGE_MODES.length]
        setMode(next)
      },
      density,
      setDensity,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, density, isLoggedIn]
  )

  return <OutfitImageModeContext.Provider value={value}>{children}</OutfitImageModeContext.Provider>
}

export function useOutfitImageMode() {
  return useContext(OutfitImageModeContext)
}
