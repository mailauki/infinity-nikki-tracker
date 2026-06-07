import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getUserRole } from '@/hooks/user'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recently'
import { Metadata } from 'next'
import { Box, Stack } from '@mui/material'
import { StatCard } from './stat-card'
import DashboardList from './dashboard-list'
import { navLinksData } from '@/lib/nav-links'
import { getEvolutions } from '@/hooks/data/evolutions'

export const metadata: Metadata = {
  title: 'Admin',
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  )
}

async function AdminContent() {
  const [
    eurekaSets,
    { eurekaVariants, trials },
    outfitSets,
    outfitVariants,
    evolutions,
    role,
    recentlyAdded,
    recentlyEdited,
  ] = await Promise.all([
    getEurekaSets(),
    getAdminData(),
    getOutfitSets(),
    getOutfitVariantsRaw(),
    getEvolutions(),
    getUserRole(),
    getRecentlyAdded(),
    getRecentlyEdited(),
  ])

  const isAdmin = role === 'admin'

  return (
    <Stack spacing={2} sx={{ pt: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.sets.add : undefined}
          count={outfitSets?.length ?? 0}
          tabHref={navLinksData.admin.outfits.sets.list}
          title="Outfit Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.variants.add : undefined}
          count={outfitVariants?.length ?? 0}
          tabHref={navLinksData.admin.outfits.variants.list}
          title="Outfit Variants"
        />
        <StatCard
          addHref={undefined}
          count={evolutions?.length ?? 0}
          tabHref={navLinksData.admin.outfits.evolutions.list}
          title="Evolutions"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.sets.add : undefined}
          count={eurekaSets?.length ?? 0}
          tabHref={navLinksData.admin.eureka.sets.list}
          title="Eureka Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.variants.add : undefined}
          count={eurekaVariants?.length ?? 0}
          tabHref={navLinksData.admin.eureka.variants.list}
          title="Eureka Variants"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.trials.add : undefined}
          count={trials?.length ?? 0}
          tabHref={navLinksData.admin.eureka.trials.list}
          title="Trials"
        />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <DashboardList items={recentlyAdded} title="Recently Added" />
        <DashboardList items={recentlyEdited} title="Recently Edited" />
      </Box>
    </Stack>
  )
}
