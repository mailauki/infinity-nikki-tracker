import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getUserRole } from '@/hooks/user'
import { Metadata } from 'next'
import { Box } from '@mui/material'
import { StatCard } from './stat-card'
import { navLinksData } from '@/lib/nav-links'
import { getEvolutions } from '@/hooks/data/evolutions'

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
  const [eurekaSets, { eurekaVariants, trials }, outfitSets, outfitVariants, evolutions, role] =
    await Promise.all([
      getEurekaSets(),
      getAdminData(),
      getOutfitSets(),
      getOutfitVariantsRaw(),
      getEvolutions(),
      getUserRole(),
    ])

  const isAdmin = role === 'admin'

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        pt: 4,
      }}
    >
      <StatCard
        addHref={isAdmin ? navLinksData.dashboard.outfits.sets.add : undefined}
        count={outfitSets?.length ?? 0}
        tabHref={navLinksData.dashboard.outfits.sets.list}
        title="Outfit Sets"
      />
      <StatCard
        addHref={isAdmin ? navLinksData.dashboard.outfits.variants.add : undefined}
        count={outfitVariants?.length ?? 0}
        tabHref={navLinksData.dashboard.outfits.variants.list}
        title="Outfit Variants"
      />
      <StatCard
        addHref={undefined}
        count={evolutions?.length ?? 0}
        tabHref={navLinksData.dashboard.outfits.evolutions.list}
        title="Evolutions"
      />
      <StatCard
        addHref={isAdmin ? navLinksData.dashboard.eureka.sets.add : undefined}
        count={eurekaSets?.length ?? 0}
        tabHref={navLinksData.dashboard.eureka.sets.list}
        title="Eureka Sets"
      />
      <StatCard
        addHref={isAdmin ? navLinksData.dashboard.eureka.variants.add : undefined}
        count={eurekaVariants?.length ?? 0}
        tabHref={navLinksData.dashboard.eureka.variants.list}
        title="Eureka Variants"
      />
      <StatCard
        addHref={isAdmin ? navLinksData.dashboard.eureka.trials.add : undefined}
        count={trials?.length ?? 0}
        tabHref={navLinksData.dashboard.eureka.trials.list}
        title="Trials"
      />
    </Box>
  )
}
