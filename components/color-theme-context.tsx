'use client'

import { createContext, useContext, useState, useMemo } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { baseThemeOptions } from '@/lib/theme'
import { COLOR_THEME_PRESETS, buildColorSchemes } from '@/lib/theme-presets'
import type { ColorTheme } from '@/lib/types/eureka'

interface ColorThemeContextValue {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextValue>({
  colorTheme: 'default',
  setColorTheme: () => {},
})

export function useColorTheme() {
  return useContext(ColorThemeContext)
}

export function ColorThemeProvider({
  children,
  initialColorTheme,
}: {
  children: React.ReactNode
  initialColorTheme: ColorTheme
}) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColorTheme)

  const theme = useMemo(() => {
    const preset = COLOR_THEME_PRESETS[colorTheme]
    return createTheme({ ...baseThemeOptions, colorSchemes: buildColorSchemes(preset) })
  }, [colorTheme])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      <ThemeProvider defaultMode="system" theme={theme}>
        {children}
      </ThemeProvider>
    </ColorThemeContext.Provider>
  )
}
