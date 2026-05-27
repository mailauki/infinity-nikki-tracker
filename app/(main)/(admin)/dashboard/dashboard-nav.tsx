'use client'

import { Box, Tab, Tabs } from '@mui/material'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Sets', href: '/dashboard/eureka/sets' },
  { label: 'Variants', href: '/dashboard/eureka/variants' },
  { label: 'Trials', href: '/dashboard/eureka/trials' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const value = tabs.findIndex((t) => t.href === pathname)

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value === -1 ? false : value}>
        {tabs.map((tab) => (
          <Tab key={tab.href} href={tab.href} label={tab.label} />
        ))}
      </Tabs>
    </Box>
  )
}
