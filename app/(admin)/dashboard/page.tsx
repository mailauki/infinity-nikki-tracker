import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getUserRole } from '@/hooks/user'
import { Metadata } from 'next'
import { Box } from '@mui/material'
import { StatCard } from './stat-card'
import DashboardToolBar from './dashboard-toolbar'
import { navLinksData } from '@/lib/nav-links'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const [eurekaSets, { eurekaVariants, trials }, outfitSets, outfitVariants, role] =
    await Promise.all([
      getEurekaSets(),
      getAdminData(),
      getOutfitSets(),
      getOutfitVariantsRaw(),
      getUserRole(),
    ])

  const isAdmin = role === 'admin'

  return (
    <>
      {isAdmin && <DashboardToolBar />}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          pt: 4,
        }}
      >
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.sets.add : undefined}
          count={eurekaSets?.length ?? 0}
          title="Eureka Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.variants.add : undefined}
          count={eurekaVariants?.length ?? 0}
          title="Eureka Variants"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.trials.add : undefined}
          count={trials?.length ?? 0}
          title="Trials"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.outfits.sets.add : undefined}
          count={outfitSets?.length ?? 0}
          title="Outfit Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.outfits.variants.add : undefined}
          count={outfitVariants?.length ?? 0}
          title="Outfit Variants"
        />
      </Box>
    </>
  )
}
