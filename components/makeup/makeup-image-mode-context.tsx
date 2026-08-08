'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { fetchPreferencesOnce } from '@/lib/preferences-cache'
import { savePreferences } from '@/lib/save-preferences'

export type MakeupImageMode = 'image' | 'alt'

export const MAKEUP_IMAGE_MODES: MakeupImageMode[] = ['image', 'alt']

export type MakeupDensity = 'standard' | 'compact'

// Resolve which image to show for the current mode, falling back to the main
// image when the requested source is missing.
export function resolveMakeupImage(
  mode: MakeupImageMode,
  sources: { image?: string | null; alt?: string | null }
): string | null | undefined {
  const { image, alt } = sources
  if (mode === 'alt') return alt || image
  return image
}

type MakeupImageModeContextValue = {
  mode: MakeupImageMode
  setMode: (mode: MakeupImageMode) => void
  cycleMode: () => void
  density: MakeupDensity
  setDensity: (density: MakeupDensity) => void
  reset: () => void
}

// Defaults make the hook safe outside a provider (e.g. nested cards).
const MakeupImageModeContext = createContext<MakeupImageModeContextValue>({
  mode: 'image',
  setMode: () => {},
  cycleMode: () => {},
  density: 'standard',
  setDensity: () => {},
  reset: () => {},
})

// A failed view-preference write must not disrupt the UI — the setting still
// applies for this session, it just may not survive a reload.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist makeup view preference:', err)
}

export function MakeupImageModeProvider({
  isLoggedIn = false,
  children,
}: {
  isLoggedIn?: boolean
  children: React.ReactNode
}) {
  const [mode, setModeState] = useState<MakeupImageMode>('image')
  const [density, setDensityState] = useState<MakeupDensity>('standard')

  useEffect(() => {
    if (!isLoggedIn) return
    fetchPreferencesOnce()
      .then((prefs: UserPreferences | null) => {
        if (!prefs) return
        if (prefs.makeup_image_mode) setModeState(prefs.makeup_image_mode as MakeupImageMode)
        if (prefs.makeup_density) setDensityState(prefs.makeup_density as MakeupDensity)
      })
      .catch(() => {})
  }, [isLoggedIn])

  const setMode = (next: MakeupImageMode) => {
    setModeState(next)
    // Fire-and-forget: the UI must never wait on this write. Running it inside a
    // transition makes the pending state track a network round-trip, so toggling
    // takes seconds to register.
    if (isLoggedIn) void savePreferences({ makeup_image_mode: next }).catch(persistFailed)
  }

  const setDensity = (next: MakeupDensity) => {
    setDensityState(next)
    if (isLoggedIn) void savePreferences({ makeup_density: next }).catch(persistFailed)
  }

  const reset = () => {
    setModeState('image')
    setDensityState('standard')
    // Both keys in one call: two concurrent upserts would race on the same row.
    if (isLoggedIn) {
      void savePreferences({ makeup_image_mode: 'image', makeup_density: 'standard' }).catch(
        persistFailed
      )
    }
  }

  const value = useMemo<MakeupImageModeContextValue>(
    () => ({
      mode,
      setMode,
      cycleMode: () => {
        const next =
          MAKEUP_IMAGE_MODES[(MAKEUP_IMAGE_MODES.indexOf(mode) + 1) % MAKEUP_IMAGE_MODES.length]
        setMode(next)
      },
      density,
      setDensity,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, density, isLoggedIn]
  )

  return <MakeupImageModeContext.Provider value={value}>{children}</MakeupImageModeContext.Provider>
}

export function useMakeupImageMode() {
  return useContext(MakeupImageModeContext)
}
