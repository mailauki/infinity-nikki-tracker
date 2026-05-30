'use client'

import { Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Sets', href: '/dashboard/eureka/sets' },
  { label: 'Variants', href: '/dashboard/eureka/variants' },
  { label: 'Trials', href: '/dashboard/eureka/trials' },
]

export default function DashboardNavTabs() {
  const pathname = usePathname()
  const tab = tabs.findIndex((t) => t.href === pathname)

  return (
    <Tabs value={tab === -1 ? false : tab}>
      {tabs.map((t) => (
        <Tab key={t.href} href={t.href} label={t.label} />
      ))}
    </Tabs>
  )
}
