import {
  Box,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Skeleton,
  Stack,
} from '@mui/material'

function SetItemSkeleton() {
  return (
    <ListItem disablePadding>
      <Card sx={{ display: 'flex', alignItems: 'center', p: 1, boxShadow: 'none', width: '100%' }}>
        <ListItemAvatar>
          <Skeleton height={56} sx={{ borderRadius: 1 }} variant="rectangular" width={56} />
        </ListItemAvatar>
        <ListItemText
          primary={<Skeleton height={20} variant="text" width="50%" />}
          secondary={<Skeleton height={16} variant="text" width={80} />}
        />
      </Card>
    </ListItem>
  )
}

function CategoryListSkeleton() {
  return (
    <List
      subheader={
        <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
          <Skeleton height={20} variant="text" width={120} />
        </ListSubheader>
      }
    >
      <SetItemSkeleton />
      <SetItemSkeleton />
      <SetItemSkeleton />
    </List>
  )
}

export default function SeasonLoading() {
  return (
    <Stack spacing={3}>
      <Skeleton height={40} variant="text" width="40%" />
      <Box>
        <CategoryListSkeleton />
        <CategoryListSkeleton />
      </Box>
    </Stack>
  )
}
