'use client'

import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  Skeleton,
} from '@mui/material'

import LazyCardMedia from './lazy-card-media'
import EurekaCard from '@/components/eureka/eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { EurekaSet, Total } from '@/lib/types/eureka'

export default function TrialsContent() {
  const { eurekaSets, trials, isLoggedIn, isLoading, isError } = useEurekaData()

  if (isError) {
    return <ErrorAlert message="Failed to load Eureka data. Please refresh the page." />
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={320} sx={{ borderRadius: 1 }} variant="rectangular" />
        ))}
      </Box>
    )
  }

  const totalTrials = trials.map((trial) => ({
    ...trial,
    eurekaSets: eurekaSets.filter((eurekaSet) =>
      eurekaSet.eureka_set_trials.some((t) => t.trial === trial.slug)
    ).slice(0, 2),
  })) as Total[]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {totalTrials.map((trial) => (
        <TrialCard key={trial.title} isLoggedIn={isLoggedIn} trial={trial} />
      ))}
    </Box>
  )
}

function TrialCard({ trial, isLoggedIn }: { trial: Total; isLoggedIn: boolean }) {
  return (
    <Card>
      <CardHeader title={trial.title} />
      <LazyCardMedia image={trial.image_url!} sx={{ height: 160 }} title={trial.title} />
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
