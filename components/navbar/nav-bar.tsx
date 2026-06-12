'use client'

import { AppBar, Toolbar, useColorScheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '@/components/color-theme-context'
import PageTitle from './page-title'
import { useNavDrawer } from './navbar-toolbar-context'
import { NavUser } from './nav-user'

export default function NavBar() {
  const { drawerOpen } = useNavDrawer()
  const { colorTheme } = useColorTheme()
  const { mode, systemMode } = useColorScheme()
  // CSS-variables mode resolves sx theme callbacks once and doesn't re-run them
  // on a color-scheme change, so derive the surface color from the active mode
  // ourselves. The mounted guard avoids an SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  const preset = COLOR_THEME_PRESETS[colorTheme]
  const surface = (isDarkMode ? preset.dark : preset.light).surface.containerLowest
  const background = `linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`

  return (
    <AppBar
      color="default"
      position="fixed"
      sx={{
        background,
        border: 0,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
        ml: { xs: 0, sm: drawerOpen ? '260px' : 'calc(var(--mui-spacing) * 10 + 21px)' },
        width: {
          xs: '100%',
          sm: drawerOpen ? 'calc(100% - 260px)' : 'calc(100% - (var(--mui-spacing) * 10 + 21px))',
        },
        transition: (theme) =>
          theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
      }}
      variant="outlined"
    >
      <Toolbar sx={{ alignItems: 'flex-end', justifyContent: 'center', mb: 2 }}>
        <PageTitle />
        <NavUser />
      </Toolbar>
      <Toolbar sx={{ mb: 2 }} />
    </AppBar>
  )
}
