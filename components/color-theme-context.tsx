'use client'

import { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { baseThemeOptions } from '@/lib/theme'
import { COLOR_THEME_PRESETS, buildColorSchemes } from '@/lib/theme-presets'
import type { ColorTheme } from '@/lib/types/eureka'
import {
  DEFAULT_TEXT_SCALE,
  TEXT_SCALE_STORAGE_KEY,
  type TextScale,
  rootFontSizePx,
} from '@/lib/text-scale'

interface ColorThemeContextValue {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  textScale: TextScale
  setTextScale: (scale: TextScale) => void
}

const ColorThemeContext = createContext<ColorThemeContextValue>({
  colorTheme: 'default',
  setColorTheme: () => {},
  textScale: 'default',
  setTextScale: () => {},
})

export function useColorTheme() {
  return useContext(ColorThemeContext)
}

export function ColorThemeProvider({
  children,
  initialColorTheme,
  initialTextScale = 'default',
}: {
  children: React.ReactNode
  initialColorTheme: ColorTheme
  initialTextScale?: TextScale
}) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColorTheme)
  const [textScale, setTextScale] = useState<TextScale>(initialTextScale)

  const theme = useMemo(() => {
    const preset = COLOR_THEME_PRESETS[colorTheme]
    return createTheme({
      ...baseThemeOptions,
      colorSchemes: buildColorSchemes(preset),
      // Every fontSize in the M3 scale is in rem, so scaling the root font size
      // scales the whole ladder at once. htmlFontSize tells MUI what 1rem now
      // means, keeping its own px->rem conversions (breakpoints, some
      // component internals) in step with the html element we set below.
      typography: {
        ...(baseThemeOptions.typography as object),
        htmlFontSize: rootFontSizePx(textScale),
      },
    })
  }, [colorTheme, textScale])

  // The actual scaling: setting font-size on <html> redefines rem for the whole
  // document, so typography and rem-based spacing move together. Mirrored to
  // localStorage for the pre-hydration script in the root layout, which applies
  // it before first paint so text doesn't visibly jump on load.
  //
  // Deliberately no cleanup that resets the size: this provider wraps the whole
  // app, so a reset would fight the pre-hydration script rather than tidy up
  // after an unmount that never happens in practice.
  //
  // The first run is skipped when it would only reassert the default. The
  // provider renders with 'default' for signed-out visitors, and writing that
  // through would undo the size the pre-hydration script already applied from
  // the mirror — the page would paint large, then snap back to 16px.
  const hasScaled = useRef(false)
  useEffect(() => {
    const isFirstRun = !hasScaled.current
    hasScaled.current = true
    if (isFirstRun && textScale === DEFAULT_TEXT_SCALE) return
    document.documentElement.style.fontSize = `${rootFontSizePx(textScale)}px`
  }, [textScale])

  // Mirror only what the viewer actually chose. This is split from the effect
  // above and skips the first run on purpose: the provider renders with the
  // 'default' fallback for signed-out visitors and before preferences load, and
  // writing that through would clear a signed-in user's saved value from the
  // mirror — their next load would then flash at the default size.
  const hasMirrored = useRef(false)
  useEffect(() => {
    if (!hasMirrored.current) {
      hasMirrored.current = true
      return
    }
    try {
      if (textScale === DEFAULT_TEXT_SCALE) window.localStorage.removeItem(TEXT_SCALE_STORAGE_KEY)
      else window.localStorage.setItem(TEXT_SCALE_STORAGE_KEY, textScale)
    } catch {
      // Private browsing or a blocked store — scaling still works for this
      // session, it just won't be applied before hydration on the next load.
    }
  }, [textScale])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, textScale, setTextScale }}>
      <ThemeProvider defaultMode="system" theme={theme}>
        {children}
      </ThemeProvider>
    </ColorThemeContext.Provider>
  )
}
