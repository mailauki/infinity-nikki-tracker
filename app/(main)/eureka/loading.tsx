import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Skeleton,
  Stack,
} from '@mui/material'
import GridContainer from '@/components/grid-container'

function SetCardSkeleton() {
  return (
    <Card>
      <CardHeader
        action={<Skeleton height={24} variant="rounded" width={60} />}
        avatar={<Skeleton height={40} variant="circular" width={40} />}
        subheader={<Skeleton width="40%" />}
        title={<Skeleton width="60%" />}
      />
      <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Skeleton width={40} />
          <Skeleton height={24} variant="rounded" width={80} />
        </Stack>
        <Skeleton height={4} variant="rectangular" />
      </CardContent>
    </Card>
  )
}

function ProgressListSkeleton() {
  return (
    <List
      subheader={
        <ListSubheader disableSticky>
          <Skeleton width={80} />
        </ListSubheader>
      }
      sx={{ width: '100%' }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <React.Fragment key={i}>
          <ListItem secondaryAction={<Skeleton height={24} variant="rounded" width={50} />}>
            <ListItemAvatar>
              <Skeleton height={40} variant="circular" width={40} />
            </ListItemAvatar>
            <ListItemText primary={<Skeleton width="60%" />} secondary={<Skeleton width="30%" />} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText inset>
              <Skeleton height={4} sx={{ mx: 2 }} variant="rectangular" />
            </ListItemText>
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  )
}

export default function EurekaSetsLoading() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <SetCardSkeleton />
              </Grid>
            ))}
          </Grid>
        }
        sideContent={<ProgressListSkeleton />}
      />
    </Container>
  )
}
