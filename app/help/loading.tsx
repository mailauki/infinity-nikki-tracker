import { Skeleton, Stack } from '@mui/material'

export default function HelpLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={1}>
        <Skeleton height={32} variant="text" width={180} />
        <Skeleton height={20} variant="text" width="60%" />
      </Stack>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={56} variant="rounded" width="100%" />
      ))}
    </Stack>
  )
}
