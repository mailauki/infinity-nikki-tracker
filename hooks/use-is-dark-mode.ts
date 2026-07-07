'use client'

import { useEffect, useState } from 'react'
import { useColorScheme } from '@mui/material'

// True when the effective color scheme is dark. The mounted guard avoids an
// SSR/client hydration mismatch: the derived value is false until after mount,
// then reflects the resolved scheme (system → systemMode, otherwise mode).
export function useIsDarkMode() {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && (mode === 'system' ? systemMode : mode) === 'dark'
}
