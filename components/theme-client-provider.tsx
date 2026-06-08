'use client'

import { useMemo, useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import defaultTheme from '@/lib/theme'
import { COLOR_THEME_PRESETS, buildColorSchemes } from '@/lib/theme-presets'
import type { ColorTheme } from '@/lib/types/eureka'

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default')

  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((prefs) => {
        const validThemes: ColorTheme[] = ['default', 'moonlight', 'cherry', 'forest']
        if (prefs.color_theme && validThemes.includes(prefs.color_theme)) {
          setColorTheme(prefs.color_theme as ColorTheme)
        }
      })
      .catch(() => {})
  }, [])

  const theme = useMemo(() => {
    if (colorTheme === 'default') return defaultTheme
    const preset = COLOR_THEME_PRESETS[colorTheme]
    return createTheme(defaultTheme, { colorSchemes: buildColorSchemes(preset) })
  }, [colorTheme])

  return (
    <ThemeProvider defaultMode="system" theme={theme}>
      {children}
    </ThemeProvider>
  )
}
