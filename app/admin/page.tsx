import { Suspense } from 'react'
import { Alert, Box, Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAdminStats } from '@/hooks/data/admin/stats'
import { getGapWorkItems, getUnassignedPieces } from '@/hooks/data/admin/gap-containers'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recents'
import AdminRecentsList from './admin-recents-list'
import AdminTotalsStrip from './admin-totals-strip'
import AdminCompletenessList from './admin-completeness-list'
import AdminGapQueue from './admin-gap-queue'
import AdminUnassignedPieces from './admin-unassigned-pieces'

export const metadata: Metadata = {
  title: 'Admin',
}

export default function AdminPage() {
  return (
    <Stack spacing={2}>
      {/* Separate boundaries so stats and recents stream independently and one
          failure cannot blank the page. */}
      <Suspense>
        <AdminOverview />
      </Suspense>
      <Suspense>
        <AdminRecents />
      </Suspense>
    </Stack>
  )
}

async function AdminOverview() {
  let stats
  try {
    stats = await getAdminStats()
  } catch {
    return <Alert severity="error">Could not load admin statistics. Try reloading.</Alert>
  }

  const [items, unassignedPieces] = await Promise.all([getGapWorkItems(), getUnassignedPieces()])

  return (
    <Stack spacing={2}>
      <AdminTotalsStrip stats={stats} />
      <AdminCompletenessList stats={stats} />
      <Suspense>
        <AdminGapQueue items={items} stats={stats} />
      </Suspense>
      <AdminUnassignedPieces pieces={unassignedPieces} />
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
