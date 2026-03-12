import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Box, CardMedia, Container, Stack } from '@mui/material'
import type { Metadata } from 'next'
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
  const trial = await getTrial(slug)
  if (!trial) notFound()

  const eurekaSets = await getEurekaSets()
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  const trialSets = eurekaSets.filter((s) => s.trial === trial?.title)
  const allVariants: EurekaVariant[] = trialSets.flatMap((s) => s.eureka_variants)
  const obtainedCount = countObtained(allVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <CardMedia image={trial.image_url!} sx={{ height: 240 }} title={trial.title} />
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
      </Stack>
    </Container>
  )
}
