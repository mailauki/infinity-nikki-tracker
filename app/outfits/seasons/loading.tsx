import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Skeleton,
} from '@mui/material'

function CategoryRowSkeleton() {
  return (
    <ListItem disableGutters secondaryAction={<Skeleton height={16} variant="text" width={16} />}>
      <ListItemText primary={<Skeleton height={20} variant="text" width="50%" />} />
    </ListItem>
  )
}

function SeasonCardSkeleton() {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        disableTypography
        avatar={<Skeleton height={48} variant="text" width={40} />}
        title={<Skeleton height={28} variant="text" width="60%" />}
      />
      <Skeleton height={160} variant="rectangular" />
      <CardContent sx={{ flexGrow: 1 }}>
        <List dense sx={{ width: '100%' }}>
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
        </List>
      </CardContent>
      <CardActions>
        <Skeleton height={36} variant="rounded" width={80} />
      </CardActions>
    </Card>
  )
}

function LocationGroupSkeleton() {
  return (
    <Box sx={{ mb: 4 }}>
      <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
        <Skeleton height={20} variant="text" width={120} />
      </ListSubheader>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          '@container (min-width: 600px)': { gridTemplateColumns: '1fr 1fr' },
          gap: 3,
        }}
      >
        <SeasonCardSkeleton />
        <SeasonCardSkeleton />
      </Box>
    </Box>
  )
}

export default function SeasonsLoading() {
  return (
    <Box sx={{ containerType: 'inline-size', flexGrow: 1, pb: 3 }}>
      <LocationGroupSkeleton />
      <LocationGroupSkeleton />
    </Box>
  )
}
