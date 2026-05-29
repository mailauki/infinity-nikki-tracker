'use client'

import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'

import LazyCardMedia from '@/components/eureka/lazy-card-media'
import EurekaCard from '@/components/eureka/eureka-card'
import { ViewAllButton } from '@/components/view-all-button'
import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { useSortOrder } from '@/components/sort-context'
import { EurekaSet, Total } from '@/lib/types/eureka'
import { Edit } from '@mui/icons-material'

export default function TrialsContent() {
  const { eurekaSets, trials, isLoggedIn, isAdmin, isLoading, isError } = useEurekaData()
  const { sortOrder } = useSortOrder()

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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {group.map((trial) => (
              <TrialCard
                key={trial.title}
                isAdmin={isAdmin}
                isLoggedIn={isLoggedIn}
                trial={trial as Total}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  )
}

function TrialCard({
  trial,
  isLoggedIn,
  isAdmin,
}: {
  trial: Total
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  return (
    <Card>
      <CardHeader
        disableTypography
        action={
          isAdmin && (
            <Tooltip title={`Edit ${trial.title}`}>
              <IconButton href={`/trial/edit/${trial.slug}`}>
                <Edit />
              </IconButton>
            </Tooltip>
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
