import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { EurekaSet, EurekaVariant, Total } from '@/lib/types/eureka'
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  Container,
  Grid,
  LinearProgress,
  List,
  ListItem,
  Stack,
} from '@mui/material'
import { countObtained, percent } from '@/hooks/count-obtained'
import EurekaCard from '@/components/eureka/eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getTrials } from '@/hooks/data/trials'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trials',
}

export default async function TrialsPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <Trials />
        </Stack>
      </Container>
    </Suspense>
  )
}

async function Trials() {
  const eurekaSets = await getEurekaSets()
  const trials = await getTrials()
  const user_id = await getUserID()
  const isLoggedIn = !!user_id!

  const totalTrials = trials?.map((trial) => ({
    ...trial,
    eurekaSets: eurekaSets.filter((eurekaSet) => eurekaSet.trial === trial.title),
  })) as Total[]

  return (
    <Grid container spacing={2}>
      {totalTrials?.map((trial) => (
        <Grid key={trial.title} size={{ xs: 12, md: 6 }}>
          <TrialCard
            eureka={trial.eurekaSets!.flatMap((eurekaSet) => eurekaSet.eureka_variants)}
            isLoggedIn={isLoggedIn}
            trial={trial}
          />
        </Grid>
      ))}
    </Grid>
  )
}

function TrialCard({
  trial,
  eureka,
  isLoggedIn,
}: {
  trial: Total
  eureka: EurekaVariant[]
  isLoggedIn: boolean
}) {
  const obtainedCount = countObtained(eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader title={trial.title} />
        <CardMedia image={trial.image_url!} sx={{ height: 160 }} title={trial.title} />
        <CardContent sx={{ p: 0 }}>
          <List sx={{ width: '100%' }}>
            {trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
              <ListItem key={eurekaSet.id} disablePadding>
                <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
                  <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size="sm" />
                </CardActionArea>
              </ListItem>
            ))}
          </List>
        </CardContent>
        <CardActions>
          <ViewAllButton href={`/eureka/trials/${trial.slug}`} />
        </CardActions>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader
        action={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            size="small"
            variant="outlined"
          />
        }
        subheader={`${percentage}%`}
        title={trial.title}
      />
      <CardContent sx={{ pt: 0 }}>
        <LinearProgress color="inherit" value={percentage} variant="determinate" />
      </CardContent>
      <CardMedia image={trial.image_url!} sx={{ height: 160 }} title={trial.title} />
      <CardContent sx={{ p: 0 }}>
        <List sx={{ width: '100%' }}>
          {trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
            <ListItem key={eurekaSet.id} disablePadding>
              <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
                <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size="sm" />
              </CardActionArea>
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions>
        <ViewAllButton href={`/eureka/trials/${trial.slug}`} />
      </CardActions>
    </Card>
  )
}
