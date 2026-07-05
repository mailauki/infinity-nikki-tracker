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
  ListSubheader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import LazyImage from '@/components/lazy-image'
import EurekaCard from './eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { useSortOrder } from '@/components/sort-context'
import { EurekaSet, Total } from '@/lib/types/eureka'
import ProgressChip from '@/components/progress-chip'
import { countObtained } from '@/hooks/count-obtained'
import { SimpleGrid } from '@/components/card-grid'

export default function TrialsContent() {
  const { eurekaSets, trials, isLoggedIn, isLoading, isError } = useEurekaData()
  const { sortOrder } = useSortOrder()

  if (isError) {
    return <ErrorAlert message="Failed to load Eureka data. Please refresh the page." />
  }

  if (isLoading) {
    return (
      <SimpleGrid columns={{ xs: '1fr', md: '1fr 1fr' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={320} sx={{ borderRadius: 1 }} variant="rectangular" />
        ))}
      </SimpleGrid>
    )
  }

  const totalTrials = trials
    .map((trial) => ({
      ...trial,
      eurekaSets: eurekaSets
        .filter((eurekaSet) => eurekaSet.eureka_set_trials.some((t) => t.trial === trial.slug))
        .sort((a, b) => b.rarity! - a.rarity!)
        .slice(0, 2)
        .sort((a, b) => a.id! - b.id!),
    }))
    .sort((a, b) => (sortOrder === 'new' ? b.id - a.id : a.id - b.id))

  const realmGroups = Object.entries(
    totalTrials.reduce<Record<string, typeof totalTrials>>((groups, trial) => {
      const realm = trial.realm ?? 'Other'
      ;(groups[realm] ??= []).push(trial)
      return groups
    }, {})
  )

  return (
    <Stack spacing={4}>
      {realmGroups.map(([realm, group]) => (
        <Box key={realm}>
          <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>{realm}</ListSubheader>
          <SimpleGrid columns={{ xs: '1fr', md: '1fr 1fr' }}>
            {group.map((trial) => (
              <TrialCard key={trial.title} isLoggedIn={isLoggedIn} trial={trial as Total} />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Stack>
  )
}

function TrialCard({ trial, isLoggedIn }: { trial: Total; isLoggedIn: boolean }) {
  const obtained = countObtained(trial.eurekaSets!.flatMap((set) => set.eureka_variants))
  return (
    <Card>
      <CardHeader
        disableTypography
        action={
          isLoggedIn && (
            <ProgressChip obtained={obtained.obtained} size="xs" total={obtained.total} />
          )
        }
        title={
          <Typography noWrap component="h2" sx={{ maxWidth: { xs: 300, sm: 360 } }} variant="h6">
            {trial.title
              .split(' ')
              .filter((word) => word !== 'Trial' && word !== 'Phantom' && word !== 'Trial:')
              .join(' ')}
          </Typography>
        }
      />
      <LazyImage image={trial.image_url!} kind="media" sx={{ height: 160 }} title={trial.title} />
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
