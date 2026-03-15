'use client'

import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  LinearProgress,
  List,
  ListItem,
  Skeleton,
} from '@mui/material'

import { countObtained, percent } from '@/hooks/count-obtained'
import EurekaCard from '@/components/eureka/eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { EurekaSet, EurekaVariant, Total } from '@/lib/types/eureka'

export default function TrialsContent() {
  const { eurekaSets, trials, isLoggedIn, isLoading, isError, isObtainedError } = useEurekaData()

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
    ),
  })) as Total[]

  return (
    <>
      {isObtainedError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load your collection status. Progress may be inaccurate.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {totalTrials.map((trial) => (
          <TrialCard
            key={trial.title}
            eureka={trial.eurekaSets!.flatMap((eurekaSet) => eurekaSet.eureka_variants)}
            isLoggedIn={isLoggedIn}
            trial={trial}
          />
        ))}
      </Box>
    </>
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
  const { obtained, total } = countObtained(eureka)
  const percentage = percent(obtained, total)

  return (
    <Card>
      <CardHeader
        action={
          isLoggedIn ? (
            <Chip label={`${obtained} / ${total}`} size="small" variant="outlined" />
          ) : undefined
        }
        subheader={isLoggedIn ? `${percentage}%` : undefined}
        title={trial.title}
      />
      {isLoggedIn && (
        <CardContent sx={{ pt: 0 }}>
          <LinearProgress color="inherit" value={percentage} variant="determinate" />
        </CardContent>
      )}
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
