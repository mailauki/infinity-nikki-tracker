'use client'

import { Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'

export default function DashboardNavTabs() {
  const pathname = usePathname()
  const dashboardTabs = navLinksData.navSecondary.find((item) => item.url === '/dashboard')?.items
  const tab = dashboardTabs?.findIndex((t) => t.url === pathname)

  return (
    <Tabs value={tab === -1 ? false : tab}>
      {dashboardTabs?.map((t) => (
        <Tab key={t.url} href={t.url} label={t.title} />
      ))}
    </Tabs>
    // <ToggleButtonGroup
    //       exclusive
    //       sx={{ whiteSpace: 'nowrap', height: 'fit-content', pt: 1 }}
    //       value={tab}
    //       onChange={handleTabChange}
    //     >
    //       <ToggleButton aria-label="Eureka Sets" sx={{ py: 0.75 }} value="eureka-sets">
    //         Eureka Sets
    //       </ToggleButton>
    //       <ToggleButton aria-label="Eureka Variants" sx={{ py: 0.75 }} value="eureka-variants">
    //         Eureka Variants
    //       </ToggleButton>
    //       <ToggleButton aria-label="Trials" sx={{ py: 0.75 }} value="trials">
    //         Trials
    //       </ToggleButton>
    //     </ToggleButtonGroup>
  )
}
