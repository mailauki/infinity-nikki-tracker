'use client'

import { Box, Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'

export default function DashboardNavTabs() {
  const pathname = usePathname()
  const dashboardTabs = navLinksData.dashboard.tabs
  const tab = dashboardTabs?.findIndex((t) => t.url === pathname)

  return (
    <Box sx={{ width: '68vw' }}>
      <Tabs
        allowScrollButtonsMobile
        scrollButtons="auto"
        value={tab === -1 ? false : tab}
        variant="scrollable"
      >
        {dashboardTabs?.map((t) => (
          <Tab key={t.url} href={t.url} label={t.title} />
        ))}
      </Tabs>
    </Box>
  )
}
