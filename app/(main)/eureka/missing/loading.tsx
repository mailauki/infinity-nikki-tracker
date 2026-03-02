import React from 'react'
import {
  Card,
  CardHeader,
  CardMedia,
  Container,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Skeleton,
} from '@mui/material'
import GridContainer from '@/components/grid-container'

function EurekaButtonSkeleton() {
  return (
    <Card>
      <CardMedia sx={{ p: 1 }}>
        <Skeleton variant="rectangular" height={100} />
      </CardMedia>
      <CardHeader title={<Skeleton width="70%" />} subheader={<Skeleton width="50%" />} />
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

export default function MissingLoading() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <GridContainer
        mainContent={
          <Grid container spacing={2}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, md: 4 }}>
                <EurekaButtonSkeleton />
              </Grid>
            ))}
          </Grid>
        }
        sideContent={<ProgressListSkeleton />}
      />
    </Container>
  )
}
