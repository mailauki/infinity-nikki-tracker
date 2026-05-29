'use client'

import { useState, useTransition } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'
import {
  Category,
  Color,
  EurekaSet,
  EurekaVariantRaw,
  Label,
  Style,
  Trial,
} from '@/lib/types/eureka'
import EurekaSetList from './eureka-set-list'
import EurekaVariantList from './eureka-variant-list'
import TrialList from './trial-list'
import DashboardToolbar from './dashboard-toolbar'
import { updateDashboardTab, updateDashboardView } from '@/app/actions/preferences'
import { useSortOrder } from '@/components/sort-context'

type TabValue = 'eureka-sets' | 'eureka-variants' | 'trials'

export function DashboardTabs({
  eurekaSets,
  eurekaVariants,
  trials,
  defaultView,
  defaultTab,
  styles,
  labels,
  categories,
  colors,
}: {
  eurekaSets: EurekaSet[]
  eurekaVariants: EurekaVariantRaw[]
  trials: Trial[]
  defaultView: 'list' | 'table'
  defaultTab: 'eureka-sets' | 'eureka-variants' | 'trials'
  styles: Style[]
  labels: Label[]
  categories: Category[]
  colors: Color[]
}) {
  const [, startTransition] = useTransition()
  const { sortOrder } = useSortOrder()

  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<TabValue>(defaultTab)
  const [view, setView] = useState<'list' | 'table'>(isSmallScreen ? 'list' : defaultView)

  const handleTabChange = (_: React.MouseEvent<HTMLElement>, value: string) => {
    if (value) {
      setTab(value as TabValue)
      startTransition(() => updateDashboardTab(value as TabValue))
    }
  }

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, nextView: 'list' | 'table') => {
    if (nextView) {
      setView(nextView)
      startTransition(() => updateDashboardView(nextView))
    }
  }

  const sortById = (a: { id: number }, b: { id: number }) =>
    sortOrder === 'new' ? b.id - a.id : a.id - b.id

  const sortedEurekaSets = [...eurekaSets].sort(sortById)
  const sortedVariants = [...eurekaVariants].sort(sortById)
  const sortedTrials = [...trials].sort(sortById)

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <DashboardToolbar
        handleTabChange={handleTabChange}
        handleViewChange={handleViewChange}
        tab={tab}
        view={view}
      />

      {tab === 'eureka-sets' &&
        (view === 'table' ? (
          <EurekaSetTable
            back="/dashboard"
            labels={labels}
            rows={sortedEurekaSets}
            styles={styles}
          />
        ) : (
          <EurekaSetList back="/dashboard" rows={sortedEurekaSets} />
        ))}

      {tab === 'eureka-variants' &&
        (view === 'table' ? (
          <EurekaVariantTable
            categories={categories}
            colors={colors}
            eurekaSets={eurekaSets}
            rows={sortedVariants}
          />
        ) : (
          <EurekaVariantList back="/dashboard" rows={sortedVariants} />
        ))}

      {tab === 'trials' &&
        (view === 'table' ? (
          <TrialTable rows={sortedTrials} />
        ) : (
          <TrialList back="/dashboard" rows={sortedTrials} />
        ))}
    </Box>
  )
}
