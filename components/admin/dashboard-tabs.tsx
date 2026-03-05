'use client'

import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'
import { DashboardTabsProps } from '@/lib/types/dashboard'

export function DashboardTabs({ eurekaSets, eurekaVariants, trials }: DashboardTabsProps) {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Eureka Sets" />
        <Tab label="Eureka Variants" />
        <Tab label="Trials" />
      </Tabs>
      {tab === 0 && <EurekaSetTable rows={eurekaSets} />}
      {tab === 1 && <EurekaVariantTable rows={eurekaVariants} />}
      {tab === 2 && <TrialTable rows={trials} />}
    </Box>
  )
}
