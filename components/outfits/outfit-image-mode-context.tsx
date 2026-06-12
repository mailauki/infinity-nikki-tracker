'use client'

import { createContext, useContext, useMemo, useState } from 'react'

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

export function OutfitImageModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<OutfitImageMode>('image')
  const [density, setDensity] = useState<OutfitDensity>('standard')

  const value = useMemo<OutfitImageModeContextValue>(
    () => ({
      mode,
      setMode,
      cycleMode: () =>
        setMode(
          (m) => OUTFIT_IMAGE_MODES[(OUTFIT_IMAGE_MODES.indexOf(m) + 1) % OUTFIT_IMAGE_MODES.length]
        ),
      density,
      setDensity,
    }),
    [mode, density]
  )

  return <OutfitImageModeContext.Provider value={value}>{children}</OutfitImageModeContext.Provider>
}

export function useOutfitImageMode() {
  return useContext(OutfitImageModeContext)
}
