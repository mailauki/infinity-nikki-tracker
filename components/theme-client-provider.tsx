'use client'

import { ColorThemeProvider } from '@/components/color-theme-context'
import type { ColorTheme } from '@/lib/types/eureka'
import type { TextScale } from '@/lib/text-scale'

export default function ThemeClientProvider({
  children,
  colorTheme,
  textScale,
}: {
  children: React.ReactNode
  colorTheme: ColorTheme
  textScale: TextScale
}) {
  return (
    <ColorThemeProvider initialColorTheme={colorTheme} initialTextScale={textScale}>
      {children}
    </ColorThemeProvider>
  )
}
