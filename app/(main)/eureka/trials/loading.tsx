import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Container,
  Grid,
  List,
  ListItem,
  Skeleton,
} from '@mui/material'

function NestedSetSkeleton() {
  return (
    <ListItem disablePadding>
      <CardHeader
        sx={{ width: '100%' }}
        avatar={<Skeleton variant="circular" width={40} height={40} />}
        title={<Skeleton width="60%" />}
        subheader={<Skeleton width="40%" />}
      />
    </ListItem>
  )
}

function TrialCardSkeleton() {
  return (
    <Card>
      <CardHeader
        title={<Skeleton width="50%" />}
        subheader={<Skeleton width="20%" />}
        action={<Skeleton variant="rounded" width={60} height={24} />}
      />
      <CardMedia sx={{ p: 1 }}>
        <Skeleton variant="rectangular" height={200} />
      </CardMedia>
      <CardContent>
        <Skeleton variant="rectangular" height={4} />
      </CardContent>
      <CardActions>
        <List sx={{ width: '100%' }}>
          <NestedSetSkeleton />
          <NestedSetSkeleton />
        </List>
      </CardActions>
    </Card>
  )
}

export default function TrialsLoading() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Grid container spacing={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <TrialCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
