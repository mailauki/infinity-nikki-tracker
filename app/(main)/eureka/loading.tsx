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
        avatar={<Skeleton variant="circular" width={40} height={40} />}
        title={<Skeleton width="60%" />}
        subheader={<Skeleton width="40%" />}
        action={<Skeleton variant="rounded" width={60} height={24} />}
      />
      <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Skeleton width={40} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Stack>
        <Skeleton variant="rectangular" height={4} />
      </CardContent>
    </Card>
  )
}

function ProgressListSkeleton() {
  return (
    <List
      sx={{ width: '100%' }}
      subheader={<ListSubheader disableSticky><Skeleton width={80} /></ListSubheader>}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <React.Fragment key={i}>
          <ListItem secondaryAction={<Skeleton variant="rounded" width={50} height={24} />}>
            <ListItemAvatar>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemAvatar>
            <ListItemText
              primary={<Skeleton width="60%" />}
              secondary={<Skeleton width="30%" />}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText inset>
              <Skeleton variant="rectangular" height={4} sx={{ mx: 2 }} />
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
