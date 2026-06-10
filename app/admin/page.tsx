import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsCount } from '@/hooks/data/admin/outfit-variants'
import { getUserRole } from '@/hooks/user'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recents'
import { Metadata } from 'next'
import { Box, Stack } from '@mui/material'
import { StatCard } from './stat-card'
import AdminRecentsList from './admin-recents-list'
import { navLinksData } from '@/lib/nav-links'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getAbilities } from '@/hooks/data/abilities'

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
    outfitVariantsCount,
    evolutions,
    abilities,
    role,
    recentlyAdded,
    recentlyEdited,
  ] = await Promise.all([
    getEurekaSets(),
    getAdminData(),
    getOutfitSets(),
    getOutfitVariantsCount(),
    getEvolutions(),
    getAbilities(),
    getUserRole(),
    getRecentlyAdded(),
    getRecentlyEdited(),
  ])

  const isAdmin = role === 'admin'

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.sets.add : undefined}
          count={outfitSets?.length ?? 0}
          listHref={navLinksData.admin.outfits.sets.list}
          title="Outfit Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.variants.add : undefined}
          count={outfitVariantsCount}
          listHref={navLinksData.admin.outfits.variants.list}
          title="Outfit Variants"
        />
        <StatCard
          addHref={undefined}
          count={evolutions?.length ?? 0}
          listHref={navLinksData.admin.outfits.evolutions.list}
          title="Evolutions"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.abilities.add : undefined}
          count={abilities?.length ?? 0}
          listHref={navLinksData.admin.outfits.abilities.list}
          title="Abilities"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.sets.add : undefined}
          count={eurekaSets?.length ?? 0}
          listHref={navLinksData.admin.eureka.sets.list}
          title="Eureka Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.variants.add : undefined}
          count={eurekaVariants?.length ?? 0}
          listHref={navLinksData.admin.eureka.variants.list}
          title="Eureka Variants"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.eureka.trials.add : undefined}
          count={trials?.length ?? 0}
          listHref={navLinksData.admin.eureka.trials.list}
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
        <AdminRecentsList items={recentlyAdded} title="Recently Added" />
        <AdminRecentsList items={recentlyEdited} title="Recently Edited" />
      </Box>
    </Stack>
  )
}
