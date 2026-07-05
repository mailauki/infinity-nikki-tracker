'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useNavDrawer, useSidebar } from './navbar-toolbar-context'
import { sidebarConfigFor } from '@/lib/sidebar-registry'
import { NAV_DRAWER_WIDTH, NAV_RAIL_FUDGE } from '@/lib/layout-constants'

// Shared AppBar positioning: the fixed NavBar and NavBarToolbar both offset their
// left margin by the nav-drawer rail and their right margin by the open sidebar,
// then shrink their width to fit. Returns a plain object to spread into each
// AppBar's `sx`; the AppBars keep their own appearance (gradient, pointerEvents).
export function useAppBarInsets() {
  const { drawerOpen } = useNavDrawer()
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const theme = useTheme()

  const sidebarConfig = sidebarConfigFor(pathname)
  const sidebarInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px - ${NAV_RAIL_FUDGE}px)`
    : `calc(${theme.spacing(10)} + ${NAV_RAIL_FUDGE}px)`

  return {
    ml: { xs: 0, sm: navInset },
    mr: { xs: 0, sm: sidebarInset },
    width: { xs: '100%', sm: `calc(100% - ${navInset} - ${sidebarInset})` },
    transition: theme.transitions.create(['margin-left', 'margin-right', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: drawerOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  }
}
