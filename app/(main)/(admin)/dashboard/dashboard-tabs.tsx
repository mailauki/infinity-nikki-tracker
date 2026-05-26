'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Container, useMediaQuery, useTheme } from '@mui/material'
import { EurekaSetTable } from '@/components/admin/eureka-set-table'
import { EurekaVariantTable } from '@/components/admin/eureka-variant-table'
import { TrialTable } from '@/components/admin/trial-table'
import {
  Category,
  Color,
  EurekaSet,
  EurekaVariantRaw,
  Label,
  Style,
  Trial,
} from '@/lib/types/eureka'
import EurekaSetList from '@/components/admin/eureka-set-list'
import EurekaVariantList from '@/components/admin/eureka-variant-list'
import TrialList from '@/components/admin/trial-list'
import DashboardToolbar from './dashboard-toolbar'
import { updateDashboardTab, updateDashboardView } from '@/app/actions/preferences'
import { useSortOrder } from '@/components/sort-context'

const TAB_VALUES = ['eureka-sets', 'eureka-variants', 'trials'] as const
type TabValue = (typeof TAB_VALUES)[number]

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const { sortOrder } = useSortOrder()

  const rawTab = searchParams.get('tab') ?? defaultTab
  const tab: TabValue = TAB_VALUES.includes(rawTab as TabValue) ? (rawTab as TabValue) : defaultTab
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [view, setView] = useState<'list' | 'table'>(isSmallScreen ? 'list' : defaultView)

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => params.set(k, v))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleTabChange = (_: React.MouseEvent<HTMLElement>, value: string) => {
    if (value) {
      updateParams({ tab: value })
      startTransition(() => updateDashboardTab(value as TabValue))
    }
  }

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, nextView: 'list' | 'table') => {
    if (nextView) {
      setView(nextView)
      startTransition(() => updateDashboardView(nextView))
    }
  }

  const back = `/dashboard?${searchParams.toString()}`
  const listProps = { back }

  const sortById = (a: { id: number }, b: { id: number }) =>
    sortOrder === 'new' ? b.id - a.id : a.id - b.id

  const sortedEurekaSets = [...eurekaSets].sort(sortById)
  const sortedVariants = [...eurekaVariants].sort(sortById)
  const sortedTrials = [...trials].sort(sortById)

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <DashboardToolbar
        handleTabChange={handleTabChange}
        handleViewChange={handleViewChange}
        tab={tab}
        view={view}
      />

      {tab === 'eureka-sets' &&
        (view === 'table' ? (
          <EurekaSetTable back={back} labels={labels} rows={sortedEurekaSets} styles={styles} />
        ) : (
          <EurekaSetList rows={sortedEurekaSets} {...listProps} />
        ))}

      {tab === 'eureka-variants' &&
        (view === 'table' ? (
          <EurekaVariantTable
            back={back}
            categories={categories}
            colors={colors}
            eurekaSets={eurekaSets}
            rows={sortedVariants}
          />
        ) : (
          <EurekaVariantList rows={sortedVariants} {...listProps} />
        ))}

      {tab === 'trials' &&
        (view === 'table' ? (
          <TrialTable back={back} rows={sortedTrials} />
        ) : (
          <TrialList rows={sortedTrials} {...listProps} />
        ))}
    </Container>
  )
}
