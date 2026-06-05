'use client'

import { Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'
import Link from 'next/link'

export default function DashboardNavTabs() {
  const pathname = usePathname()
  const dashboardTabs = navLinksData.dashboard.tabs
  const outfitsTabs = dashboardTabs.find((tab) => tab.title === 'Outfits')?.items ?? []
  const eurekaTabs = dashboardTabs.find((tab) => tab.title === 'Eureka')?.items ?? []
  const isOutfitsPath = pathname.split('/')[2] === 'outfits'
  const isEurekaPath = pathname.split('/')[2] === 'eureka'

  let activeTabs = dashboardTabs
  if (isOutfitsPath) activeTabs = outfitsTabs
  else if (isEurekaPath) activeTabs = eurekaTabs
  const activeIndex = activeTabs.findIndex((t) => t.url === pathname)
  const value = activeIndex === -1 ? false : activeIndex

  return (
    <Tabs sx={{ flexGrow: 1 }} value={value}>
      {activeTabs.map((t) => (
        <Tab
          key={t.url}
          component={Link}
          href={t.url}
          label={t.title}
          sx={{ flexGrow: { xs: 1, md: 0 } }}
        />
      ))}
    </Tabs>
  )
}
