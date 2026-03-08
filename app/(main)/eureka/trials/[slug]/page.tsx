import { Suspense } from 'react'

import {
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
} from '@mui/material'
import type { Metadata } from 'next'

import EurekaCard from '@/components/eureka/eureka-card'
import PageContainer from '@/components/page-container'
import { countObtained, percent } from '@/hooks/count-obtained'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrial } from '@/hooks/data/trials'
import { getUserID } from '@/hooks/user'
import { EurekaSet, EurekaVariant } from '@/lib/types/eureka'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trial = await getTrial(slug)
  return { title: trial?.title }
}

export default async function TrialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <PageContainer>
        <Trial slug={slug} />
      </PageContainer>
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
    <Card>
      <CardHeader
        title={trial?.title}
        subheader={isLoggedIn ? `${percentage}%` : undefined}
        action={
          isLoggedIn ? (
            <Chip
              label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
              variant="outlined"
              size="small"
            />
          ) : undefined
        }
      />
      {isLoggedIn && (
        <CardContent sx={{ pt: 0 }}>
          <LinearProgress value={percentage} variant="determinate" color="inherit" />
        </CardContent>
      )}
      <CardMedia sx={{ height: 240 }} image={trial?.image_url!} title={trial?.title} />
      <CardContent sx={{ p: 0 }}>
        <Grid container spacing={2} sx={{ p: 2 }}>
          {trialSets.map((eurekaSet: EurekaSet) => (
            <Grid key={eurekaSet.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <List sx={{ width: '100%', p: 0 }}>
                <ListItem disablePadding>
                  <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
                    <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size="sm" />
                  </CardActionArea>
                </ListItem>
              </List>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}
