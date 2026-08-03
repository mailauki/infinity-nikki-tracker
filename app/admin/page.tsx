import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getUserRole } from '@/hooks/user'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recents'
import { Metadata } from 'next'
import { Box, Stack } from '@mui/material'
import { StatCard } from './stat-card'
import AdminRecentsList from './admin-recents-list'
import { navLinksData } from '@/lib/nav-links'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getAbilities } from '@/hooks/data/abilities'
import { getSeasons } from '@/hooks/data/seasons'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getMakeupSets } from '@/hooks/data/makeup-sets'
import { getMakeupVariantsRaw } from '@/hooks/data/admin/makeup-variants'

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
    abilities,
    seasons,
    seasonCategories,
    makeupSets,
    makeupVariants,
    role,
    recentlyAdded,
    recentlyEdited,
  ] = await Promise.all([
    getEurekaSets(),
    getAdminData(),
    getOutfitSets(),
    getOutfitVariantsRaw(),
    getEvolutions(),
    getAbilities(),
    getSeasons(),
    getSeasonCategories(),
    // Base sets only — getMakeupSets folds evolutions into their base, matching
    // how the Outfit Sets card counts (getOutfitSets filters base_set IS NULL).
    getMakeupSets(),
    getMakeupVariantsRaw(),
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
          count={outfitVariants?.length ?? 0}
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
          addHref={isAdmin ? navLinksData.admin.outfits.seasons.add : undefined}
          count={seasons?.length ?? 0}
          listHref={navLinksData.admin.outfits.seasons.list}
          title="Seasons"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.outfits.seasonCategories.add : undefined}
          count={seasonCategories?.length ?? 0}
          listHref={navLinksData.admin.outfits.seasonCategories.list}
          title="Season Categories"
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
        <StatCard
          addHref={isAdmin ? navLinksData.admin.makeup.sets.add : undefined}
          count={makeupSets?.length ?? 0}
          listHref={navLinksData.admin.makeup.sets.list}
          title="Makeup Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.admin.makeup.variants.add : undefined}
          count={makeupVariants?.length ?? 0}
          listHref={navLinksData.admin.makeup.variants.list}
          title="Makeup Variants"
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
