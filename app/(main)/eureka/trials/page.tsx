import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { getEurekaSets, getTrials } from '@/lib/data'
import { Eureka, EurekaSet, Total } from '@/lib/types/types'
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
} from '@mui/material'
import Image from 'next/image'
import { count, percent } from '@/hooks/count'
import EurekaHeader from '@/components/eureka-header'

export default async function TrialsPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Trials />
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
    eurekaSets: eurekaSets.filter((eurekaSet) => eurekaSet.trial === trial.name),
  })) as Total[]

  return (
    <Grid container spacing={2}>
      {totalTrials?.map((trial) => (
        <Grid key={trial.name} size={{ xs: 12, md: 6 }}>
          <TrialCard
            trial={trial}
            eureka={trial.eurekaSets!.flatMap((eurekaSet) => eurekaSet.eureka)}
            isLoggedIn={isLoggedIn}
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
  eureka: Eureka[]
  isLoggedIn: boolean
}) {
  const obtainedCount = count(eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Card>
      <CardHeader
        title={trial.name}
        subheader={`${percentage}%`}
        action={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
      />
      <CardMedia sx={{ p: 1 }}>
        <Image src={trial.image_url!} alt={trial.name!} width={500} height={500} />
      </CardMedia>
      <CardContent>
        <LinearProgress value={percentage} variant="determinate" color="inherit" />
      </CardContent>
      <CardActions>
        <List sx={{ width: '100%' }}>
          {trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
            <CardActionArea key={eurekaSet.id} href={`/eureka/${eurekaSet.slug}`}>
              <EurekaHeader eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
            </CardActionArea>
          ))}
        </List>
      </CardActions>
    </Card>
  )
}
