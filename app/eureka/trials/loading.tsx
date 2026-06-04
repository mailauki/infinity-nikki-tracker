import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListSubheader,
  Skeleton,
  Stack,
} from '@mui/material'

function SetRowSkeleton() {
  return (
    <ListItem disablePadding sx={{ px: 2, py: 1 }}>
      <Stack direction="row" spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
        <Skeleton height={40} variant="circular" width={40} />
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Skeleton height={20} variant="text" width="60%" />
          <Skeleton height={16} variant="text" width="40%" />
        </Stack>
      </Stack>
    </ListItem>
  )
}

function TrialCardSkeleton() {
  return (
    <Card>
      <CardHeader disableTypography title={<Skeleton height={28} variant="text" width="50%" />} />
      <Skeleton height={160} variant="rectangular" />
      <CardContent sx={{ p: 0 }}>
        <List disablePadding>
          <SetRowSkeleton />
          <SetRowSkeleton />
        </List>
      </CardContent>
      <CardActions>
        <Skeleton height={36} variant="rounded" width={80} />
      </CardActions>
    </Card>
  )
}

function RealmGroupSkeleton() {
  return (
    <Box>
      <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
        <Skeleton height={20} variant="text" width={120} />
      </ListSubheader>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TrialCardSkeleton />
        <TrialCardSkeleton />
      </Box>
    </Box>
  )
}

export default function TrialsLoading() {
  return (
    <Box sx={{ flexGrow: 1, pb: 3 }}>
      <Stack spacing={4}>
        <RealmGroupSkeleton />
        <RealmGroupSkeleton />
      </Stack>
    </Box>
  )
}
