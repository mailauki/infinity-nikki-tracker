'use client'

import { AppBar, Toolbar, useColorScheme } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '@/components/color-theme-context'
import PageTitle from './page-title'
import { useNavDrawer, useFilterDrawer } from './navbar-toolbar-context'
import { NavUser } from './nav-user'
import { FILTER_DRAWER_WIDTH, FILTER_PAGES } from '@/components/filter/filter-menu'
import { NAV_DRAWER_WIDTH } from './nav-drawer'

export default function NavBar() {
  const { drawerOpen } = useNavDrawer()
  const { filterOpen } = useFilterDrawer()
  const pathname = usePathname()
	const theme = useTheme()
  const filterPushed = filterOpen && FILTER_PAGES.includes(pathname)
  const filterInset = filterPushed ? `calc(${FILTER_DRAWER_WIDTH}px + 21px)` : '0px'
	const navInset = drawerOpen ? `calc(${NAV_DRAWER_WIDTH}px) - 21px` : `calc(${theme.spacing(10)} + 21px)`
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
        ml: { xs: 0, sm: navInset },
        mr: { xs: 0, sm: filterInset },
        width: {
          xs: '100%',
          sm: `calc(100% - ${navInset} - ${filterInset})`,
        },
        transition: (theme) =>
          theme.transitions.create(['margin-left', 'margin-right', 'width'], {
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
