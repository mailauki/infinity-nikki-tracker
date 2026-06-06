'use client'

import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { IconButton, Stack } from '@mui/material'
import DashboardNavTabs from './dashboard-nav-tabs'
import DashboardViewToggle from './dashboard-view-toggle'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from '@mui/icons-material'
import { useFormConfig } from '@/app/(admin)/form-context'

export default function DashboardToolBar() {
  const pathname = usePathname()
  const { formId } = useFormConfig()
  const isDashboardMainPage = pathname === '/dashboard'

  if (formId) return null
  return (
    <NavBarToolbar>
      <Stack
        direction="row"
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {!isDashboardMainPage && (
          <IconButton component="a" href="/dashboard">
            <ChevronLeft />
          </IconButton>
        )}
        <DashboardNavTabs />
        {!isDashboardMainPage && <DashboardViewToggle />}
      </Stack>
    </NavBarToolbar>
  )
}
