'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Container, useMediaQuery, useTheme } from '@mui/material'
import { EurekaSetTable } from './eureka-set-table'
import { EurekaVariantTable } from './eureka-variant-table'
import { TrialTable } from './trial-table'
import { EurekaSet, EurekaVariantRaw, Trial } from '@/lib/types/eureka'
import EurekaSetList from './eureka-set-list'
import EurekaVariantList from './eureka-variant-list'
import TrialList from './trial-list'
import DashboardToolbar from './dashboard-toolbar'

export function DashboardTabs({
  eurekaSets,
  eurekaVariants,
  trials,
}: {
  eurekaSets: EurekaSet[]
  eurekaVariants: EurekaVariantRaw[]
  trials: Trial[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const TAB_VALUES = ['eureka-sets', 'eureka-variants', 'trials'] as const
  type TabValue = (typeof TAB_VALUES)[number]
  const rawTab = searchParams.get('tab') ?? 'eureka-sets'
  const tab: TabValue = TAB_VALUES.includes(rawTab as TabValue)
    ? (rawTab as TabValue)
    : 'eureka-sets'
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const defaultView = isSmallScreen ? 'list' : 'table'
  const rawView = searchParams.get('view')
  const view: 'list' | 'table' = rawView === 'list' || rawView === 'table' ? rawView : defaultView
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))
  const perPage = Number(searchParams.get('perPage') ?? '15')

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => params.set(k, v))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleTabChange = (_: React.MouseEvent<HTMLElement>, value: string) => {
    if (value) updateParams({ tab: value, page: '0' })
  }

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, nextView: 'list' | 'table') => {
    if (nextView) updateParams({ view: nextView })
  }

  const handlePageChange = (newPage: number) => updateParams({ page: String(newPage) })
  const handleRowsPerPageChange = (newPerPage: number) =>
    updateParams({ perPage: String(newPerPage), page: '0' })

  const currentUrl = `/dashboard?${searchParams.toString()}`
  const paginationProps = {
    page,
    rowsPerPage: perPage,
    onPageChange: handlePageChange,
    onRowsPerPageChange: handleRowsPerPageChange,
    back: currentUrl,
  }

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <DashboardToolbar
        handleTabChange={handleTabChange}
        handleViewChange={handleViewChange}
        tab={tab}
        view={view}
      />

      {tab === 'eureka-sets' && view === 'table' && (
        <EurekaSetTable rows={eurekaSets} {...paginationProps} />
      )}
      {tab === 'eureka-variants' && view === 'table' && (
        <EurekaVariantTable rows={eurekaVariants} {...paginationProps} />
      )}
      {tab === 'trials' && view === 'table' && <TrialTable rows={trials} {...paginationProps} />}

      {tab === 'eureka-sets' && view === 'list' && (
        <EurekaSetList rows={eurekaSets} {...paginationProps} />
      )}
      {tab === 'eureka-variants' && view === 'list' && (
        <EurekaVariantList rows={eurekaVariants} {...paginationProps} />
      )}
      {tab === 'trials' && view === 'list' && <TrialList rows={trials} {...paginationProps} />}
    </Container>
  )
}
