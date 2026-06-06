'use client'

import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { AppBar, IconButton, Stack, Toolbar } from '@mui/material'
import DashboardNavTabs from './dashboard-nav-tabs'
import DashboardViewToggle from './dashboard-view-toggle'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ChevronLeft } from '@mui/icons-material'
import { useFormConfig } from '@/app/(admin)/form-context'

export default function DashboardToolBar() {
  const pathname = usePathname()
  const { formId, setFormConfig } = useFormConfig()
  const isDashboardMainPage = pathname === '/dashboard'
  const isFormRoute = pathname.endsWith('/new') || pathname.includes('/edit/')
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current && !isFormRoute && formId) {
      setFormConfig({ formId: '', backUrl: '', pending: false, showAddAnother: false })
    }
    mounted.current = true
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isFormRoute) return null
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
