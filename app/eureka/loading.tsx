import { Box, Skeleton, Stack } from '@mui/material'
import CardGrid, { CardGridHeader } from '@/components/card-grid'

function GroupSkeleton() {
  return (
    <CardGrid
      header={
        <CardGridHeader
          actions={<Skeleton height={24} variant="rounded" width={60} />}
          title={<Skeleton height={28} variant="text" width={120} />}
        />
      }
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          height={0}
          style={{ paddingBottom: '133%' }}
          sx={{ borderRadius: 1 }}
          variant="rectangular"
          width="100%"
        />
      ))}
    </CardGrid>
  )
}

export default function EurekaLoading() {
  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={4}>
        <GroupSkeleton />
        <GroupSkeleton />
        <GroupSkeleton />
      </Stack>
    </Box>
  )
}
