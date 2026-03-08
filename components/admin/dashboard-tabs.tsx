'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tab = Math.min(2, Math.max(0, Number(searchParams.get('tab') ?? '0')))
  const view = searchParams.get('view') === 'list' ? 'list' : 'table'
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))
  const perPage = Number(searchParams.get('perPage') ?? '15')

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => params.set(k, v))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleTabChange = (_: React.SyntheticEvent, value: number) => {
    updateParams({ tab: String(value), page: '0' })
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
    <Box>
      <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Eureka Sets" />
            <Tab label="Eureka Variants" />
            <Tab label="Trials" />
          </Tabs>
          <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1, mx: 1 }}>
            <ToggleButtonGroup size="small" value={view} onChange={handleViewChange} exclusive>
              <ToggleButton value="list" aria-label="list">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="table" aria-label="table">
                <ViewHeadline />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      {tab === 0 && view === 'table' && <EurekaSetTable rows={eurekaSets} {...paginationProps} />}
      {tab === 1 && view === 'table' && (
        <EurekaVariantTable rows={eurekaVariants} {...paginationProps} />
      )}
      {tab === 2 && view === 'table' && <TrialTable rows={trials} {...paginationProps} />}

      {tab === 0 && view === 'list' && <EurekaSetList rows={eurekaSets} {...paginationProps} />}
      {tab === 1 && view === 'list' && (
        <EurekaVariantList rows={eurekaVariants} {...paginationProps} />
      )}
      {tab === 2 && view === 'list' && <TrialList rows={trials} {...paginationProps} />}
    </Box>
  )
}
