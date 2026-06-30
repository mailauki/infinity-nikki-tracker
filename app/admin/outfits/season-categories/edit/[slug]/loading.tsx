import { Skeleton, Stack } from '@mui/material'

export default function EditSeasonCategoryLoading() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 'sm', py: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={56} variant="rounded" />
      ))}
    </Stack>
  )
}
