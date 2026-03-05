import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { getEurekaSets, getTrials } from '@/lib/data'
import { EurekaSet, EurekaVariant, Total } from '@/lib/types/types'
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
} from '@mui/material'
import Image from 'next/image'
import { countObtained, percent } from '@/hooks/count'
import EurekaCard from '@/components/eureka/eureka-card'

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
            eureka={trial.eurekaSets!.flatMap((eurekaSet) => eurekaSet.eureka_variants)}
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
  eureka: EurekaVariant[]
  isLoggedIn: boolean
}) {
  const obtainedCount = countObtained(eureka)
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
      <CardContent sx={{ pt: 0 }}>
        <LinearProgress value={percentage} variant="determinate" color="inherit" />
      </CardContent>
			<CardMedia
        sx={{ height: 160 }}
        image={trial.image_url!}
        title={trial.name}
      />
      {/* <CardMedia sx={{ p: 1 }}>
        <Image src={trial.image_url!} alt={trial.name!} width={500} height={500} />
      </CardMedia> */}
      <CardActions>
        <List sx={{ width: '100%' }}>
          {trial.eurekaSets?.map((eurekaSet: EurekaSet) => (
            <ListItem key={eurekaSet.id} disablePadding>
              <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
                <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size="sm" />
              </CardActionArea>
            </ListItem>
          ))}
        </List>
      </CardActions>
    </Card>
  )
}
