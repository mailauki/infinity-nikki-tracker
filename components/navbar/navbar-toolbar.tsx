'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useNavDrawer, useSidebar } from './navbar-toolbar-context'
import { AppBar, Toolbar, useTheme } from '@mui/material'
import { sidebarConfigFor } from '@/lib/sidebar-registry'
import { NAV_DRAWER_WIDTH } from './nav-drawer'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const { drawerOpen } = useNavDrawer()
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const theme = useTheme()
  const sidebarConfig = sidebarConfigFor(pathname)
  const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
    : `calc(${theme.spacing(10)} + 21px)`
  return (
    <AppBar
      color="transparent"
      component="div"
      position="fixed"
      sx={{
        borderColor: 'transparent',
        pointerEvents: 'none',
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
      <Toolbar sx={{ mb: 2 }} />
      <Toolbar sx={{ mb: 2, pointerEvents: 'auto' }}>{children}</Toolbar>
    </AppBar>
  )
}
