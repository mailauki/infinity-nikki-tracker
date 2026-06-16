'use client'

import { Stack } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useFilterDrawer } from '../navbar/navbar-toolbar-context'
import { FILTER_DRAWER_WIDTH, FILTER_PAGES } from './filter-menu'

// Wraps the main content column and reserves space on the right for the
// permanent filter panel when it is open (sm+ only — below sm the panel
// overlays as a temporary drawer and does not push content). Mirrors the
// margin/width transition the left nav drawer drives on NavBar.
export default function FilterContentShim({ children }: { children: React.ReactNode }) {
  const { filterOpen } = useFilterDrawer()
  const pathname = usePathname()
  const pushed = filterOpen && FILTER_PAGES.includes(pathname)

  return (
    <Stack
      sx={{
        flex: 1,
        minHeight: '100vh',
        minWidth: '300px',
        justifyContent: 'flex-start',
        mr: { xs: 0, sm: pushed ? `${FILTER_DRAWER_WIDTH}px` : 0 },
        transition: (theme) =>
          theme.transitions.create('margin-right', {
            easing: theme.transitions.easing.sharp,
            duration: pushed
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      {children}
    </Stack>
  )
}
