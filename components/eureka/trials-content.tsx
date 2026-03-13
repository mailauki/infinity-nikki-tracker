'use client'

import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
} from '@mui/material'

import { countObtained, percent } from '@/hooks/count-obtained'
import EurekaCard from '@/components/eureka/eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { EurekaSet, EurekaVariant, Total } from '@/lib/types/eureka'

export default function TrialsContent() {
  const { eurekaSets, trials, isLoggedIn } = useEurekaData()

  const totalTrials = trials.map((trial) => ({
    ...trial,
    eurekaSets: eurekaSets.filter((eurekaSet) => eurekaSet.trial === trial.title),
  })) as Total[]

  return (
    <Grid container spacing={2}>
      {totalTrials.map((trial) => (
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
