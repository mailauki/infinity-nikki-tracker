import { Skeleton, Stack } from '@mui/material'

export default function EditLocationLoading() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 'sm', py: 3 }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} height={56} variant="rounded" />
      ))}
    </Stack>
  )
}
