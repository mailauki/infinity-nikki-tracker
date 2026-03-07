'use client'

import { useState } from 'react'
import { Box, Paper, Tab, Tabs } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'
import { EurekaSet, EurekaVariantRaw, Trial } from '@/lib/types/eureka'

export function DashboardTabs({
	eurekaSets, eurekaVariants, trials,
}: {
	eurekaSets: EurekaSet[]
	eurekaVariants: EurekaVariantRaw[]
	trials: Trial[]
}) {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Paper variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Eureka Sets" />
          <Tab label="Eureka Variants" />
          <Tab label="Trials" />
        </Tabs>
      </Paper>
      {tab === 0 && <EurekaSetTable rows={eurekaSets} />}
      {tab === 1 && <EurekaVariantTable rows={eurekaVariants} />}
      {tab === 2 && <TrialTable rows={trials} />}
    </Box>
  )
}
