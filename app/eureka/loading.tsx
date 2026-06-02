import { Box, Divider, Skeleton, Stack } from '@mui/material'
import { GRID_COLUMNS } from '@/lib/types/props'

function GroupSkeleton() {
  return (
    <Box>
      <Stack alignItems="flex-end" direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Skeleton height={28} variant="text" width={120} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: { xs: 1, sm: 1.5, md: 2 } }}
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
      </Box>
    </Box>
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
