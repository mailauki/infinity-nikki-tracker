'use client'

import * as React from 'react'
import { alpha, AppBar, Toolbar } from '@mui/material'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '../color-theme-context'
import PageTitle from './page-title'
import { NavUser } from './nav-user'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
	const { colorTheme } = useColorTheme()
	const preset = COLOR_THEME_PRESETS[colorTheme]
	const gradient = (surface: string) =>
		`linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`
	const background = gradient(preset.light.surface.containerLowest)
	const darkBackground = gradient(preset.dark.surface.containerLowest)
	
  return (
    <AppBar
			color='default'
      component="div"
      position="sticky"
      sx={(theme) => ({
        background,
        ...theme.applyStyles('dark', { background: darkBackground }),
        border: 0,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
        top: 0,
      })}
      variant="outlined"
    >
			<Toolbar sx={{ mb: 2 }} />
      <Toolbar sx={{ mb: 2 }}>{children}</Toolbar>
    </AppBar>
  )
}
