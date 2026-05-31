import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Box, Stack } from '@mui/material'
import type { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrial } from '@/hooks/data/trials'
import { getUserRole } from '@/hooks/user'
import EurekaSetCard from '@/components/eureka/eureka-set-card'
import LazyCardMedia from '@/components/eureka/lazy-card-media'
import { GRID_COLUMNS } from '@/lib/types/props'
import EditToolBar from '../../../../components/edit-toolbar'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trial = await getTrial(slug)
  if (!trial) return {}
  return { title: trial.title }
}

export default async function TrialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <Trial slug={slug} />
    </Suspense>
  )
}

async function Trial({ slug }: { slug: string }) {
  const [trial, eurekaSets, role] = await Promise.all([
    getTrial(slug),
    getEurekaSets(),
    getUserRole(),
  ])
  const isAdmin = role === 'admin'
  if (!trial) notFound()

  const trialSets = eurekaSets
    .filter((set) => set.eureka_set_trials.some((t) => t.trial === trial.slug))
    .sort((a, b) => b.rarity! - a.rarity!)

  return (
    <>
      <EditToolBar isAdmin={isAdmin} />
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <LazyCardMedia image={trial.image_url!} sx={{ height: 360 }} title={trial.title} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: 0,
          }}
        >
          {trialSets.map((eurekaSet) => (
            <EurekaSetCard key={eurekaSet.slug} eurekaSet={eurekaSet} />
          ))}
        </Box>
      </Stack>
    </>
  )
}
