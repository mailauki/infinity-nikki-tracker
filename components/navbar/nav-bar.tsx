'use client'

import { AppBar, Toolbar } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
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
  const filterInset = filterPushed ? `${FILTER_DRAWER_WIDTH}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
    : `calc(${theme.spacing(10)} + 21px)`
  const { colorTheme } = useColorTheme()

  // Build the surface gradient for both schemes and let MUI's CSS-variables
  // dark class swap them. Deriving the color from useColorScheme + a mounted
  // guard instead made the gradient (and thus the AppBar's emotion className)
  // differ between SSR and the first client render → a hydration mismatch.
  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.containerLowest)
  const darkBackground = gradient(preset.dark.surface.containerLowest)

  return (
    <AppBar
      color="default"
      position="fixed"
      sx={(theme) => ({
        background,
        ...theme.applyStyles('dark', { background: darkBackground }),
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
        transition: theme.transitions.create(['margin-left', 'margin-right', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: drawerOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
      })}
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
