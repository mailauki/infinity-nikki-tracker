import { Box, Skeleton, Stack } from '@mui/material'
import { GRID_COLUMNS } from '@/lib/types/props'

export default function TrialLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Skeleton height={360} variant="rectangular" width="100%" />
      <Skeleton height={20} variant="text" width="70%" />
      <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: { xs: 1, sm: 1.5, md: 2 } }}>
        {Array.from({ length: 4 }).map((_, i) => (
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
