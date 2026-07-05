'use client'

import { Stack } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useSidebar } from '../navbar/navbar-toolbar-context'
import { sidebarConfigFor } from '@/lib/sidebar-registry'

// Wraps the main content column and reserves space on the right for the permanent
// sidebar when it is open (sm+ only — below sm the sidebar overlays as a temporary
// drawer and does not push content). Mirrors the margin/width transition the left
// nav drawer drives on NavBar. Registry-driven: any registered route participates.
export default function SidebarContentShim({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const config = sidebarConfigFor(pathname)
  const pushed = sidebarOpen && config !== null

  return (
    <Stack
      sx={{
        flex: 1,
        minHeight: '100vh',
        minWidth: '300px',
        justifyContent: 'flex-start',
        mr: { xs: 0, sm: pushed ? `${config!.width}px` : 0 },
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
