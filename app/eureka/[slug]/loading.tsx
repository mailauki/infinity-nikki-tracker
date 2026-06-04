import { Box, Divider, Skeleton, Stack } from '@mui/material'
import { GRID_COLUMNS } from '@/lib/types/props'

export default function EurekaSetLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={1}>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Skeleton height={96} variant="rounded" width={96} />
          <Skeleton height={32} variant="rounded" width={80} />
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Skeleton height={24} variant="text" width={100} />
          <Skeleton height={24} variant="text" width={80} />
        </Stack>
      </Stack>

      <Skeleton height={20} variant="text" width="80%" />

      <Stack>
        <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between' }}>
          <Skeleton height={28} variant="text" width={120} />
          <Skeleton height={24} variant="rounded" width={60} />
        </Stack>
        <Divider />
      </Stack>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: { xs: 1, sm: 1.5, md: 2 } }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
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
    </Stack>
  )
}
