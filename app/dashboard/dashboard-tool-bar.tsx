'use client'

import SubAppBar from '@/components/sub-appbar'
import { Stack } from '@mui/material'
import DashboardNavTabs from './dashboard-nav-tabs'
import DashboardViewToggle from './dashboard-view-toggle'
import { usePathname } from 'next/navigation'

export default function DashboardToolBar() {
	const pathname = usePathname()
	const isDashboardMainPage = pathname === '/dashboard'
  return (
    <SubAppBar>
      <Stack sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <DashboardNavTabs />
          {!isDashboardMainPage && <DashboardViewToggle />}
        </Stack>
      </Stack>
    </SubAppBar>
  )
}
