import { Suspense } from 'react'
import { Alert, Box, Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAdminStats } from '@/hooks/data/admin/stats'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recents'
import { parseEntityKey, parseGapKind, type AdminEntityKey } from '@/lib/admin-entities'
import AdminRecentsList from './admin-recents-list'
import AdminTotalsStrip from './admin-totals-strip'
import AdminCompletenessList from './admin-completeness-list'
import AdminGapQueue from './admin-gap-queue'

export const metadata: Metadata = {
  title: 'Admin',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Stack spacing={2}>
      {/* Separate boundaries so stats and recents stream independently and one
          failure cannot blank the page. */}
      <Suspense>
        <AdminOverview searchParams={searchParams} />
      </Suspense>
      <Suspense>
        <AdminRecents />
      </Suspense>
    </Stack>
  )
}

async function AdminOverview({ searchParams }: { searchParams: SearchParams }) {
  const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams

  let stats
  try {
    stats = await getAdminStats()
  } catch {
    return <Alert severity="error">Could not load admin statistics. Try reloading.</Alert>
  }

  const gap = parseGapKind(rawGap)
  // Default to the largest entity that actually has gaps, so the queue opens on
  // real work rather than an empty state.
  const fallback: AdminEntityKey =
    [...stats].sort((a, b) => b.gaps - a.gaps)[0]?.key ?? 'outfit-variants'
  const entity = parseEntityKey(rawEntity) ?? fallback

  const parsedPage = Number.parseInt(rawPage ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <Stack spacing={2}>
      <AdminTotalsStrip stats={stats} />
      <AdminCompletenessList stats={stats} />
      <Suspense key={`${entity}-${gap}-${page}`}>
        <AdminGapQueue entity={entity} gap={gap} page={page} stats={stats} />
      </Suspense>
    </Stack>
  )
}

async function AdminRecents() {
  const [recentlyAdded, recentlyEdited] = await Promise.all([
    getRecentlyAdded(),
    getRecentlyEdited(),
  ])

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <AdminRecentsList items={recentlyAdded} title="Recently Added" />
      <AdminRecentsList items={recentlyEdited} title="Recently Edited" />
    </Box>
  )
}
