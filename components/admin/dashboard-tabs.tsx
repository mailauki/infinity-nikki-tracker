'use client'

import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'

type EurekaSetRow = {
  id: number
  slug: string | null
  name: string
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
  updated_at: string | null
}

type EurekaVariantRow = {
  id: number
  slug: string | null
  eureka_set: string | null
  category: string | null
  color: string | null
  image_url: string | null
  default: boolean
  updated_at: string | null
}

type TrialRow = {
  id: number
  slug: string | null
  name: string
  image_url: string | null
  [key: string]: unknown
}

interface DashboardTabsProps {
  eurekaSets: EurekaSetRow[]
  eurekaVariants: EurekaVariantRow[]
  trials: TrialRow[]
}

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
