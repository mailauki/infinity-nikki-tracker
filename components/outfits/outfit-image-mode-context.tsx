'use client'

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { updateOutfitDensity, updateOutfitImageMode } from '@/app/actions/preferences'

// The image swap cycles through these three sources. Not every entity has all
// three (variants/evolutions have no poster) — consumers fall back as needed.
export type OutfitImageMode = 'image' | 'alt' | 'poster'

// Cycle order; `image` (the main image) is the default starting mode.
export const OUTFIT_IMAGE_MODES: OutfitImageMode[] = ['image', 'alt', 'poster']

// Card layout density for the outfits grid. `list` is planned but not yet
// implemented.
export type OutfitDensity = 'standard' | 'compact'

// Resolve which image to show for the current mode, falling back to the main
// image when the requested source is missing (e.g. no poster/alt).
export function resolveOutfitImage(
  mode: OutfitImageMode,
  sources: { poster?: string | null; image?: string | null; alt?: string | null }
): string | null | undefined {
  const { poster, image, alt } = sources
  if (mode === 'alt') return alt || image
  if (mode === 'poster') return poster || image
  return image
}

type OutfitImageModeContextValue = {
  mode: OutfitImageMode
  setMode: (mode: OutfitImageMode) => void
  cycleMode: () => void
  density: OutfitDensity
  setDensity: (density: OutfitDensity) => void
}

// Defaults make the hook safe outside a provider (e.g. nested cards), where no
// provider is mounted.
const OutfitImageModeContext = createContext<OutfitImageModeContextValue>({
  mode: 'image',
  setMode: () => {},
  cycleMode: () => {},
  density: 'standard',
  setDensity: () => {},
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, density, isLoggedIn]
  )

  return <OutfitImageModeContext.Provider value={value}>{children}</OutfitImageModeContext.Provider>
}

export function useOutfitImageMode() {
  return useContext(OutfitImageModeContext)
}
