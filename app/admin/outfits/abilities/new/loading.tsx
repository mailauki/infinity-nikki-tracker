import { Skeleton, Stack } from '@mui/material'

export default function NewAbilityLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <Stack key={i} spacing={0.5}>
          <Skeleton height={20} variant="text" width={120} />
          <Skeleton height={56} variant="rounded" width="100%" />
        </Stack>
      ))}
      <Skeleton height={36} variant="rounded" width={100} />
    </Stack>
  )
}
