import { Suspense } from 'react'

import { Box, CardMedia } from '@mui/material'
import type { Metadata } from 'next'

import PageContainer from '@/components/page-container'
import { countObtained, percent } from '@/hooks/count-obtained'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrial } from '@/hooks/data/trials'
import { getUserID } from '@/hooks/user'
import { EurekaVariant } from '@/lib/types/eureka'
import EurekaSetCard from '@/components/eureka/eureka-set-card'
import EurekaCardProgress from '@/components/eureka/eureka-card-progress'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trial = await getTrial(slug)
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
  const trial = await getTrial(slug)
  const eurekaSets = await getEurekaSets()
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  const trialSets = eurekaSets.filter((s) => s.trial === trial?.title)
  const allVariants: EurekaVariant[] = trialSets.flatMap((s) => s.eureka_variants)
  const obtainedCount = countObtained(allVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <PageContainer title={trial.title}>
      <CardMedia sx={{ height: 240 }} image={trial.image_url!} title={trial.title} />
      {isLoggedIn && <EurekaCardProgress percentage={percentage} size="lg" />}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: isLoggedIn ? '1fr 1fr' : '1fr 1fr 1fr',
          },
          gap: 2,
        }}
      >
        {trialSets.map((eurekaSet) => (
          <EurekaSetCard key={eurekaSet.title} eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
        ))}
      </Box>
    </PageContainer>
  )
}
