'use client'

import { useState } from 'react'
import { Box, Paper, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'
import { EurekaSet, EurekaVariantRaw, Trial } from '@/lib/types/eureka'
import { ViewHeadline, ViewList } from '@mui/icons-material'
import EurekaSetList from './eureka-set-list'
import EurekaVariantList from './eureka-variant-list'
import TrialList from './trial-list'

export function DashboardTabs({
  eurekaSets,
  eurekaVariants,
  trials,
}: {
  eurekaSets: EurekaSet[]
  eurekaVariants: EurekaVariantRaw[]
  trials: Trial[]
}) {
  const [tab, setTab] = useState(0)
	const [view, setView] = useState<'list'|'table'>('table')

	const handleChange = (event: React.MouseEvent<HTMLElement>, nextView: 'list'|'table') => {
    setView(nextView);
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
				<Stack direction='row' alignItems='center' justifyContent='space-between'>
					<Tabs value={tab} onChange={(_, value) => setTab(value)}>
						<Tab label="Eureka Sets" />
						<Tab label="Eureka Variants" />
						<Tab label="Trials" />
					</Tabs>
					<Stack direction='row' justifyContent='flex-end' sx={{ flex: 1, mx: 1 }}>
					<ToggleButtonGroup
						size='small'
						value={view}
						onChange={handleChange}
						exclusive
					>
						<ToggleButton value='list' aria-label="list">
							<ViewList />
						</ToggleButton>
						<ToggleButton value='table' aria-label="table">
							<ViewHeadline />
						</ToggleButton>
					</ToggleButtonGroup>
				</Stack>
				</Stack>
      </Paper>

      {tab === 0 && view === 'table' && <EurekaSetTable rows={eurekaSets} />}
      {tab === 1 && view === 'table' && <EurekaVariantTable rows={eurekaVariants} />}
      {tab === 2 && view === 'table' && <TrialTable rows={trials} />}

      {tab === 0 && view === 'list' && <EurekaSetList rows={eurekaSets} />}
      {tab === 1 && view === 'list' && <EurekaVariantList rows={eurekaVariants} />}
      {tab === 2 && view === 'list' && <TrialList rows={trials} />}
    </Box>
  )
}
