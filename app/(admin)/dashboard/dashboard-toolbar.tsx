'use client'

import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { Stack } from '@mui/material'
import DashboardNavTabs from './dashboard-nav-tabs'
import DashboardViewToggle from './dashboard-view-toggle'
import { usePathname } from 'next/navigation'

export default function DashboardToolBar() {
  const pathname = usePathname()
  const isDashboardMainPage = pathname === '/dashboard'
  return (
    <NavBarToolbar>
      <Stack sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <DashboardNavTabs />
          {!isDashboardMainPage && <DashboardViewToggle />}
        </Stack>
      </Stack>
    </NavBarToolbar>
  )
}
