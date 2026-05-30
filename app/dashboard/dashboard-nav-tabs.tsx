'use client'

import { Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'

export default function DashboardNavTabs() {
  const pathname = usePathname()
	const dashboardTabs = navLinksData.navSecondary.find(item => item.url === '/dashboard')?.items
  const tab = dashboardTabs?.findIndex((t) => t.url === pathname)

  return (
    <Tabs value={tab === -1 ? false : tab}>
      {dashboardTabs?.map((t) => (
        <Tab key={t.url} href={t.url} label={t.title} />
      ))}
    </Tabs>
  )
}
