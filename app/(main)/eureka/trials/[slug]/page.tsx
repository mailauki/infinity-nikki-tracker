import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Box, Container, Stack } from '@mui/material'
import type { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrial } from '@/hooks/data/trials'
import EurekaSetCard from '@/components/eureka/eureka-set-card'
import LazyCardMedia from '@/components/eureka/lazy-card-media'
import { GRID_COLUMNS } from '@/lib/types/props'

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
  const [trial, eurekaSets] = await Promise.all([getTrial(slug), getEurekaSets()])
  if (!trial) notFound()

  const trialSets = eurekaSets.filter((set) =>
    set.eureka_set_trials.some((t) => t.trial === trial.slug)
  )

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <LazyCardMedia image={trial.image_url!} sx={{ height: 240 }} title={trial.title} />
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: GRID_COLUMNS,
							gap: { xs: 1, sm: 1.5, md: 2 },
							py: 0,
							mb: 4,
						}}
					>
          {trialSets.map((eurekaSet) => (
            <EurekaSetCard key={eurekaSet.slug} eurekaSet={eurekaSet} />
          ))}
        </Box>
      </Stack>
    </Container>
  )
}
