import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
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
      <Skeleton height={160} variant="rectangular" />
      <CardContent sx={{ p: 0 }}>
        <List sx={{ width: '100%' }}>
          <NestedSetSkeleton />
          <NestedSetSkeleton />
        </List>
      </CardContent>
      <CardActions>
        <Skeleton height={36} variant="rounded" width={80} />
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
