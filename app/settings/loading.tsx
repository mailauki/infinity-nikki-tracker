import { Box, Skeleton, Stack } from '@mui/material'

export default function SettingsLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ pb: 0.5 }}>
          <Skeleton height={40} variant="rounded" width={80} />
          <Skeleton height={40} variant="rounded" width={100} />
          <Skeleton height={40} variant="rounded" width={80} />
        </Stack>
      </Box>
      <Stack spacing={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Stack key={i} spacing={0.5}>
            <Skeleton height={20} variant="text" width={120} />
            <Skeleton height={56} variant="rounded" width="100%" />
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
