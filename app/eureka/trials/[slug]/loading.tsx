import { Skeleton, Stack } from '@mui/material'
import CardGrid from '@/components/card-grid'

export default function TrialLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Skeleton height={360} variant="rectangular" width="100%" />
      <Skeleton height={20} variant="text" width="70%" />
      <CardGrid>
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
      </CardGrid>
    </Stack>
  )
}
