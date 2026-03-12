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
        avatar={<Skeleton height={40} variant="circular" width={40} />}
        subheader={<Skeleton width="40%" />}
        sx={{ width: '100%' }}
        title={<Skeleton width="60%" />}
      />
    </ListItem>
  )
}

function TrialCardSkeleton() {
  return (
    <Card>
      <CardHeader
        action={<Skeleton height={24} variant="rounded" width={60} />}
        subheader={<Skeleton width="20%" />}
        title={<Skeleton width="50%" />}
      />
      <CardMedia sx={{ p: 1 }}>
        <Skeleton height={200} variant="rectangular" />
      </CardMedia>
      <CardContent>
        <Skeleton height={4} variant="rectangular" />
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
