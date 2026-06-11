'use client'

import { createContext, useContext } from 'react'

type OutfitImageModeContextValue = {
  // When true, components show alt_image_url (falling back to image_url).
  showAlt: boolean
  toggleAlt: () => void
}

// Defaults make the hook safe outside the slug page (e.g. the main outfits
// grid), where no provider is mounted.
const OutfitImageModeContext = createContext<OutfitImageModeContextValue>({
  showAlt: false,
  toggleAlt: () => {},
})

export const OutfitImageModeProvider = OutfitImageModeContext.Provider

export function useOutfitImageMode() {
  return useContext(OutfitImageModeContext)
}
