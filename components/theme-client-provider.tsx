'use client'

import { ColorThemeProvider } from '@/components/color-theme-context'
import type { ColorTheme } from '@/lib/types/eureka'

export default function ThemeClientProvider({
  children,
  colorTheme,
}: {
  children: React.ReactNode
  colorTheme: ColorTheme
}) {
  return <ColorThemeProvider initialColorTheme={colorTheme}>{children}</ColorThemeProvider>
}
